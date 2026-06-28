// Pure helpers for the Stock Screener feature.
// Aggregates real insider_transactions rows into per-company stats.
//
// NOTE on denormalized trade fields (see CLAUDE.md): rows carry both
// transaction_type/trade_type and a raw transaction_code, with inconsistent
// casing across the ingestion paths. classifyTx() checks all of them
// defensively. Ingestion maps Form 4 code P -> BUY and S -> SELL; we treat
// only those as open-market buy/sell signal and ignore grants/exercises/etc.

export interface Tx {
  company_id: string
  insider_id?: string | null
  transaction_date: string | null
  transaction_type?: string | null
  trade_type?: string | null
  transaction_code?: string | null
  shares?: number | null
  price_per_share?: number | null
  total_value?: number | null
  insider_name?: string | null
  insider_title?: string | null
  form4_url?: string | null
}

export type TxSide = 'BUY' | 'SELL' | null

export type SortKey = 'score' | 'net' | 'recent'

export interface FilingRef {
  insiderName: string
  dateMs: number
  date: string | null
  value: number
  url: string | null
}

export interface CompanyStats {
  latestBuy: FilingRef | null
  latestSell: FilingRef | null
  buys30: number
  sells30: number
  buys90: number
  sells90: number
  buys180: number
  sells180: number
  totalBuyValue: number
  totalSellValue: number
  netValue: number
  latestActivityMs: number
}

const DAY_MS = 86400000

// BUY = normalized type 'BUY' or raw code 'P'. SELL = 'SELL' or 'S'.
// Everything else (A grant, M exercise, F tax, G gift, ...) is not counted.
export function classifyTx(tx: Tx): TxSide {
  const fields = [tx.transaction_type, tx.trade_type, tx.transaction_code]
  for (const raw of fields) {
    const v = (raw == null ? '' : String(raw)).trim().toUpperCase()
    if (v === 'BUY' || v === 'P') return 'BUY'
    if (v === 'SELL' || v === 'S') return 'SELL'
  }
  return null
}

// Dollar value of a transaction: prefer total_value, else shares * price_per_share.
export function txValue(tx: Tx): number {
  const total = Number(tx.total_value)
  if (Number.isFinite(total) && total > 0) return total
  const shares = Number(tx.shares) || 0
  const pps = Number(tx.price_per_share) || 0
  const v = shares * pps
  return Number.isFinite(v) ? v : 0
}

function parseMs(d: string | null | undefined): number {
  if (!d) return NaN
  const t = Date.parse(d)
  return Number.isNaN(t) ? NaN : t
}

function emptyStats(): CompanyStats {
  return {
    latestBuy: null,
    latestSell: null,
    buys30: 0, sells30: 0,
    buys90: 0, sells90: 0,
    buys180: 0, sells180: 0,
    totalBuyValue: 0,
    totalSellValue: 0,
    netValue: 0,
    latestActivityMs: 0,
  }
}

// Aggregate one company's transactions. `nowMs` is passed in so this stays pure.
export function aggregateCompany(txs: Tx[], nowMs: number): CompanyStats {
  const s = emptyStats()
  const c30 = nowMs - 30 * DAY_MS
  const c90 = nowMs - 90 * DAY_MS
  const c180 = nowMs - 180 * DAY_MS

  for (const tx of txs) {
    const side = classifyTx(tx)
    if (side === null) continue
    const ms = parseMs(tx.transaction_date)
    const hasMs = !Number.isNaN(ms)
    if (hasMs && ms > s.latestActivityMs) s.latestActivityMs = ms
    const value = txValue(tx)
    const ref: FilingRef = {
      insiderName: tx.insider_name || 'Unknown insider',
      dateMs: hasMs ? ms : 0,
      date: tx.transaction_date || null,
      value,
      url: tx.form4_url || null,
    }

    if (side === 'BUY') {
      s.totalBuyValue += value
      if (hasMs) {
        if (ms >= c30) s.buys30++
        if (ms >= c90) s.buys90++
        if (ms >= c180) s.buys180++
      }
      if (!s.latestBuy || ref.dateMs > s.latestBuy.dateMs) s.latestBuy = ref
    } else {
      s.totalSellValue += value
      if (hasMs) {
        if (ms >= c30) s.sells30++
        if (ms >= c90) s.sells90++
        if (ms >= c180) s.sells180++
      }
      if (!s.latestSell || ref.dateMs > s.latestSell.dateMs) s.latestSell = ref
    }
  }

  s.netValue = s.totalBuyValue - s.totalSellValue
  return s
}

// Group all transactions by company_id and aggregate each group.
export function aggregateByCompany(txs: Tx[], nowMs: number): Record<string, CompanyStats> {
  const groups: Record<string, Tx[]> = {}
  for (const tx of txs) {
    if (!tx.company_id) continue
    ;(groups[tx.company_id] ||= []).push(tx)
  }
  const out: Record<string, CompanyStats> = {}
  for (const id of Object.keys(groups)) out[id] = aggregateCompany(groups[id], nowMs)
  return out
}

// Compact money formatting, e.g. $1.2B / $3.4M / $12K / $850. Uses the unicode
// minus sign for negatives (the brand palette has no red to signal direction).
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

export function fmtDate(d: string | null | undefined): string {
  if (!d) return '—'
  const t = Date.parse(d)
  if (Number.isNaN(t)) return d
  return new Date(t).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
