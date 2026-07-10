// Helpers for the Billionaires Corner feature.
//
// IMPORTANT (see the build brief): the ONLY SEC-verified, filing-linked data
// available in this project is Form 4 (insider_transactions, which carries
// form4_url). There are no 13F / 13D / 13G tables yet, and there is no FK
// linking a billionaire_profiles row to its filings — the only join key is the
// person's NAME. So holdings here are Form 4 filings matched to a person by
// filer name (nameMatches), and most profiles will legitimately have none.
// Profile-level fields (net worth, category, source of wealth) are NOT in SEC
// data and come only from the billionaire_profiles table; net worth is shown as
// an estimate and "Not available" when absent. Nothing is fabricated.

export interface BillTx {
  id: string
  insider_id?: string | null
  company_id?: string | null
  transaction_date: string | null
  transaction_code?: string | null
  transaction_type?: string | null
  trade_type?: string | null
  shares?: number | null
  price_per_share?: number | null
  total_value?: number | null
  shares_owned_following?: number | null
  insider_name?: string | null
  insider_title?: string | null
  form4_url?: string | null
  companies?: { ticker: string; name: string; sector: string | null } | null
}

export type Side = 'BUY' | 'SELL' | 'AWARD' | 'EXERCISE' | 'OTHER'

export interface Holding {
  companyId: string
  ticker: string
  name: string
  sector: string | null
  txs: BillTx[]        // newest first
  totalValue: number
  latestDateMs: number
  confidence: number
  reasons: string[]    // which scoring rules fired (transparency)
}

const DAY_MS = 86400000
const NAME_SUFFIXES = new Set(['JR', 'SR', 'II', 'III', 'IV', 'V'])

// ---- Name matching -------------------------------------------------------
// Tokenize a name, dropping punctuation, single-letter middle initials, and
// generational suffixes so "Henry Samueli" matches "SAMUELI HENRY JR".
function nameTokens(s: string | null | undefined): string[] {
  return (s || '')
    .toUpperCase()
    .replace(/[.,]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 1 && !NAME_SUFFIXES.has(t))
}

// Conservative match: require >= 2 shared tokens AND every token of the shorter
// name to appear in the longer one. Avoids matching on a shared surname alone.
export function nameMatches(a: string | null | undefined, b: string | null | undefined): boolean {
  const ta = new Set(nameTokens(a))
  const tb = new Set(nameTokens(b))
  if (ta.size < 2 || tb.size < 2) return false
  const [small, large] = ta.size <= tb.size ? [ta, tb] : [tb, ta]
  let shared = 0
  for (const t of small) if (large.has(t)) shared++
  return shared >= 2 && shared === small.size
}

// ---- Transaction classification -----------------------------------------
export function txValue(tx: BillTx): number {
  const total = Number(tx.total_value)
  if (Number.isFinite(total) && total > 0) return total
  const shares = Number(tx.shares) || 0
  const pps = Number(tx.price_per_share) || 0
  const v = shares * pps
  return Number.isFinite(v) ? v : 0
}

function codeOf(tx: BillTx): string {
  return (tx.transaction_code || '').trim().toUpperCase()
}

export function txSide(tx: BillTx): Side {
  const code = codeOf(tx)
  if (code === 'P') return 'BUY'
  if (code === 'S') return 'SELL'
  if (code === 'A') return 'AWARD'
  if (code === 'M') return 'EXERCISE'
  if (!code) {
    const t = (tx.transaction_type || tx.trade_type || '').trim().toUpperCase()
    if (t === 'BUY') return 'BUY'
    if (t === 'SELL') return 'SELL'
  }
  return 'OTHER'
}

// Open-market = a real purchase/sale (Form 4 code P or S), NOT a grant (A) or
// option exercise (M). Used for the "open-market not grant +20" rule.
export function isOpenMarket(tx: BillTx): boolean {
  const code = codeOf(tx)
  if (code === 'P' || code === 'S') return true
  if (!code) {
    const t = (tx.transaction_type || tx.trade_type || '').trim().toUpperCase()
    return t === 'BUY' || t === 'SELL'
  }
  return false
}

function parseMs(d: string | null | undefined): number {
  if (!d) return NaN
  const t = Date.parse(d)
  return Number.isNaN(t) ? NaN : t
}

function median(values: number[]): number {
  if (!values.length) return 0
  const s = [...values].sort((a, b) => a - b)
  const mid = Math.floor(s.length / 2)
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2
}

// ---- Confidence score (brief rules, per stock, max 100) -------------------
//   verified SEC filing            +35  (always — these are Form 4 filings)
//   recent within 90 days          +20
//   open-market (not grant)        +20
//   large relative size            +15  (stock value >= person median AND >= $1M)
//   cluster activity               +10  (>= 2 tx in the stock within a 30d window)
const LARGE_VALUE_FLOOR = 1_000_000

function hasCluster(txs: BillTx[]): boolean {
  const ms = txs.map(t => parseMs(t.transaction_date)).filter(n => !Number.isNaN(n)).sort((a, b) => a - b)
  for (let i = 1; i < ms.length; i++) {
    if (ms[i] - ms[i - 1] <= 30 * DAY_MS) return true
  }
  return false
}

export function scoreHolding(
  txs: BillTx[],
  stockValue: number,
  personMedian: number,
  nowMs: number
): { confidence: number; reasons: string[] } {
  const reasons: string[] = []
  let score = 35
  reasons.push('Verified SEC filing +35')

  const recent = txs.some(t => {
    const ms = parseMs(t.transaction_date)
    return !Number.isNaN(ms) && ms >= nowMs - 90 * DAY_MS
  })
  if (recent) { score += 20; reasons.push('Recent (within 90 days) +20') }

  if (txs.some(isOpenMarket)) { score += 20; reasons.push('Open-market, not a grant +20') }

  if (stockValue >= LARGE_VALUE_FLOOR && stockValue >= personMedian) {
    score += 15
    reasons.push('Large relative size +15')
  }

  if (hasCluster(txs)) { score += 10; reasons.push('Cluster activity +10') }

  return { confidence: Math.min(100, score), reasons }
}

// Group a person's matched transactions into per-stock holdings with scores.
export function aggregateHoldings(txs: BillTx[], nowMs: number): Holding[] {
  const groups: Record<string, BillTx[]> = {}
  for (const tx of txs) {
    const key = tx.company_id || tx.companies?.ticker || 'unknown'
    ;(groups[key] ||= []).push(tx)
  }

  const stockValues: Record<string, number> = {}
  for (const key of Object.keys(groups)) {
    stockValues[key] = groups[key].reduce((sum, t) => sum + txValue(t), 0)
  }
  const personMedian = median(Object.values(stockValues))

  const holdings: Holding[] = Object.keys(groups).map(key => {
    const list = [...groups[key]].sort((a, b) => (parseMs(b.transaction_date) || 0) - (parseMs(a.transaction_date) || 0))
    const totalValue = stockValues[key]
    const { confidence, reasons } = scoreHolding(list, totalValue, personMedian, nowMs)
    const co = list[0]?.companies
    const latestDateMs = parseMs(list[0]?.transaction_date) || 0
    return {
      companyId: key,
      ticker: co?.ticker || (list[0]?.companies?.ticker ?? '—'),
      name: co?.name || '',
      sector: co?.sector ?? null,
      txs: list,
      totalValue,
      latestDateMs,
      confidence,
      reasons,
    }
  })

  holdings.sort((a, b) => b.confidence - a.confidence || b.totalValue - a.totalValue)
  return holdings
}

// Flat newest-first transaction list across all holdings.
export function sortTxNewestFirst(txs: BillTx[]): BillTx[] {
  return [...txs].sort((a, b) => (parseMs(b.transaction_date) || 0) - (parseMs(a.transaction_date) || 0))
}

// ---- Formatters ----------------------------------------------------------
export function fmtMoney(n: number): string {
  if (!Number.isFinite(n) || n === 0) return '$0'
  const neg = n < 0
  const a = Math.abs(n)
  let body: string
  if (a >= 1e9) body = '$' + (a / 1e9).toFixed(a >= 1e10 ? 0 : 1) + 'B'
  else if (a >= 1e6) body = '$' + (a / 1e6).toFixed(a >= 1e7 ? 0 : 1) + 'M'
  else if (a >= 1e3) body = '$' + (a / 1e3).toFixed(0) + 'K'
  else body = '$' + Math.round(a)
  return (neg ? '−' : '') + body
}

// Net worth is an ESTIMATE from the DB, never an SEC fact. Null => not available.
export function fmtNetWorth(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(Number(n)) || Number(n) <= 0) return 'Not available'
  return fmtMoney(Number(n)) + ' (estimated)'
}

export function fmtDate(d: string | null | undefined): string {
  if (!d) return '—'
  const t = Date.parse(d)
  if (Number.isNaN(t)) return d
  return new Date(t).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function categoryLabel(cat: string | null | undefined): string {
  switch ((cat || '').toLowerCase()) {
    case 'richest': return 'Top Richest'
    case 'affluent': return 'Affluent'
    case 'entrepreneur': return 'Entrepreneur'
    case 'tech': return 'Tech Leader'
    default: return cat ? cat.charAt(0).toUpperCase() + cat.slice(1) : 'Uncategorized'
  }
}
