'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { supabase } from '../../lib/supabase'
import {
  aggregateByCompany,
  fmtDate,
  fmtMoney,
  type CompanyStats,
  type FilingRef,
  type SortKey,
  type Tx,
} from './screener'

interface Row {
  company_id: string
  ticker: string
  name: string
  sector: string | null
  score: number
  ai_summary: string | null
}

const POPULAR = ['AAPL', 'MSFT', 'NVDA', 'GOOGL', 'META', 'AMZN', 'TSLA', 'AMD']

const NAV = [
  { label: 'Signals', href: '/' },
  { label: 'Sell Alerts', href: '/sell-alerts' },
  { label: 'Congress', href: '/congress' },
  { label: 'Institutions', href: '/institutions' },
  { label: 'Subscribe', href: '/pricing' },
]

const SORTS: { key: SortKey; label: string }[] = [
  { key: 'score', label: 'Signal Score' },
  { key: 'net', label: 'Net Insider Value' },
  { key: 'recent', label: 'Most Recent' },
]

const PAGE_SIZE = 20

function scoreColor(s: number) {
  if (s >= 70) return '#C9A84C'
  if (s >= 50) return '#DFC48B'
  return '#7E8C83'
}

function truncate(s: string, n: number) {
  return s.length > n ? s.slice(0, n - 1) + '…' : s
}

// Pull every insider_transactions row in batches (Supabase caps each query at
// ~1000). Bounded by a generous safety cap so a huge table can't hang the page.
async function fetchAllTransactions(): Promise<Tx[]> {
  const all: Tx[] = []
  const BATCH = 1000
  const CAP = 20000
  for (let from = 0; from < CAP; from += BATCH) {
    const { data, error } = await supabase
      .from('insider_transactions')
      .select(
        'company_id, transaction_date, transaction_type, trade_type, transaction_code, shares, price_per_share, total_value, insider_name, insider_title, form4_url'
      )
      .order('transaction_date', { ascending: false })
      .range(from, from + BATCH - 1)
    if (error) throw error
    if (!data || data.length === 0) break
    all.push(...(data as Tx[]))
    if (data.length < BATCH) break
  }
  return all
}

export default function StockScreener() {
  const [rows, setRows] = useState<Row[]>([])
  const [statsMap, setStatsMap] = useState<Record<string, CompanyStats>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [debounced, setDebounced] = useState('')
  const [insiderIds, setInsiderIds] = useState<Set<string> | null>(null)

  const [sortKey, setSortKey] = useState<SortKey>('score')
  const [page, setPage] = useState(0)

  // Initial load: companies + scores + all transactions, aggregated once.
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const [compRes, scoreRes, txs] = await Promise.all([
          supabase.from('companies').select('id, ticker, name, sector'),
         supabase.from('rankings').select('company_id, score, ai_summary'),
          fetchAllTransactions(),
        ])
        if (compRes.error) throw compRes.error
        if (scoreRes.error) throw scoreRes.error
        if (cancelled) return

        const scoreMap = new Map<string, { score: number; ai_summary: string | null }>()
        for (const s of scoreRes.data || []) {
          scoreMap.set(s.company_id, { score: Number(s.score) || 0, ai_summary: s.ai_summary ?? null })
        }
        const built: Row[] = (compRes.data || []).map(c => {
          const sc = scoreMap.get(c.id)
          return {
            company_id: c.id,
            ticker: c.ticker,
            name: c.name,
            sector: c.sector ?? null,
            score: sc?.score ?? 0,
            ai_summary: sc?.ai_summary ?? null,
          }
        })
        setStatsMap(aggregateByCompany(txs, Date.now()))
        setRows(built)
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load screener data')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [])

  // Debounce the search box.
  useEffect(() => {
    const id = setTimeout(() => setDebounced(search.trim()), 250)
    return () => clearTimeout(id)
  }, [search])

  // Resolve insider-name matches to company ids (search by insider).
  useEffect(() => {
    let cancelled = false
    const run = async () => {
      if (debounced.length < 2) {
        setInsiderIds(null)
        return
      }
      const { data } = await supabase.from('insiders').select('company_id').ilike('name', `%${debounced}%`)
      if (cancelled) return
      setInsiderIds(new Set((data || []).map(d => d.company_id).filter(Boolean) as string[]))
    }
    run()
    return () => { cancelled = true }
  }, [debounced])

  // Reset to the first page whenever the filter/sort view changes. Done with the
  // "adjust state during render" pattern (not an effect) to avoid an extra pass.
  const viewKey = debounced + '|' + sortKey
  const [prevViewKey, setPrevViewKey] = useState(viewKey)
  if (viewKey !== prevViewKey) {
    setPrevViewKey(viewKey)
    setPage(0)
  }

  const filtered = useMemo(() => {
    const q = debounced.toLowerCase()
    let list = rows
    if (q) {
      list = rows.filter(r =>
        r.ticker.toLowerCase().includes(q) ||
        (r.name || '').toLowerCase().includes(q) ||
        (insiderIds ? insiderIds.has(r.company_id) : false)
      )
    }
    const net = (r: Row) => statsMap[r.company_id]?.netValue ?? 0
    const recent = (r: Row) => statsMap[r.company_id]?.latestActivityMs ?? 0
    const sorted = [...list]
    sorted.sort((a, b) => {
      if (sortKey === 'net') return net(b) - net(a) || b.score - a.score || a.ticker.localeCompare(b.ticker)
      if (sortKey === 'recent') return recent(b) - recent(a) || b.score - a.score || a.ticker.localeCompare(b.ticker)
      return b.score - a.score || a.ticker.localeCompare(b.ticker)
    })
    return sorted
  }, [rows, statsMap, debounced, insiderIds, sortKey])

  const total = filtered.length
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const safePage = Math.min(page, pageCount - 1)
  const pageRows = filtered.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE)
  const rangeStart = total === 0 ? 0 : safePage * PAGE_SIZE + 1
  const rangeEnd = Math.min(total, safePage * PAGE_SIZE + PAGE_SIZE)

  const COLS: { label: string; align: 'left' | 'right' }[] = [
    { label: '#', align: 'left' },
    { label: 'Company', align: 'left' },
    { label: 'Score', align: 'right' },
    { label: 'Latest Buy', align: 'left' },
    { label: 'Latest Sell', align: 'left' },
    { label: 'Buys / Sells (30 / 90 / 180d)', align: 'left' },
    { label: 'Buy Value', align: 'right' },
    { label: 'Sell Value', align: 'right' },
    { label: 'Net Insider', align: 'right' },
  ]

  const cellPad = '14px 16px'

  function filingCell(ref: FilingRef | null, side: 'BUY' | 'SELL') {
    if (!ref) return <span style={{ color: '#5E6E64' }}>—</span>
    const color = side === 'BUY' ? '#C9A84C' : '#7E8C83'
    return (
      <div>
        <div style={{ color: '#F7F4EF', fontSize: '13px' }} title={ref.insiderName}>{truncate(ref.insiderName, 22)}</div>
        <div style={{ color: '#8FA097', fontSize: '11px', marginTop: '2px' }}>
          {fmtDate(ref.date)} · <span style={{ color, fontFamily: 'monospace' }}>{fmtMoney(ref.value)}</span>
        </div>
        {ref.url ? (
          <a href={ref.url} target="_blank" rel="noopener noreferrer" style={{ color: '#C9A84C', fontSize: '11px', textDecoration: 'none' }}>Form 4 ↗</a>
        ) : null}
      </div>
    )
  }

  function activityCell(st: CompanyStats | undefined) {
    const windows = [
      { l: '30d', b: st?.buys30 ?? 0, s: st?.sells30 ?? 0 },
      { l: '90d', b: st?.buys90 ?? 0, s: st?.sells90 ?? 0 },
      { l: '180d', b: st?.buys180 ?? 0, s: st?.sells180 ?? 0 },
    ]
    return (
      <div style={{ display: 'grid', gap: '3px' }}>
        {windows.map(w => (
          <div key={w.l} style={{ display: 'flex', gap: '10px', fontSize: '12px', fontFamily: 'monospace', alignItems: 'center' }}>
            <span style={{ color: '#5E6E64', width: '32px' }}>{w.l}</span>
            <span style={{ color: '#C9A84C' }}>▲ {w.b}</span>
            <span style={{ color: '#7E8C83' }}>▼ {w.s}</span>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#07130E', color: '#F7F4EF', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <header style={{ borderBottom: '1px solid rgba(201,168,76,0.18)', padding: '18px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <Link href="/" style={{ textDecoration: 'none', color: '#F7F4EF', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '22px' }}>📒</span>
          <span style={{ fontFamily: 'Georgia, serif', letterSpacing: '0.14em', fontSize: '15px' }}>THE <em style={{ color: '#C9A84C', fontStyle: 'italic' }}>HIDDEN</em> LEDGER</span>
        </Link>
        <nav style={{ display: 'flex', gap: '22px', flexWrap: 'wrap' }}>
          {NAV.map(n => (
            <Link key={n.href} href={n.href} style={{ color: '#B9C4BC', textDecoration: 'none', fontSize: '13px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{n.label}</Link>
          ))}
        </nav>
      </header>

      <section style={{ background: 'linear-gradient(180deg, #1B4332 0%, #07130E 100%)', padding: '56px 24px 36px', textAlign: 'center' }}>
        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '38px', margin: '0 0 12px', color: '#F7F4EF' }}>Stock Screener</h1>
        <p style={{ color: '#B9C4BC', maxWidth: '620px', margin: '0 auto', fontSize: '15px', lineHeight: 1.6 }}>
          Every company we track, ranked by insider-signal score and built from real SEC Form 4 filings.
          Search by ticker, company, or insider — then sort by signal, net insider value, or most recent activity.
        </p>
      </section>

      <main style={{ maxWidth: '1280px', margin: '0 auto', padding: '28px 24px 80px' }}>
        {/* Controls */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by ticker, company, or insider name…"
            style={{ flex: '1 1 320px', padding: '14px 16px', borderRadius: '10px', border: '1px solid rgba(201,168,76,0.3)', background: '#0D1F16', color: '#F7F4EF', fontSize: '15px' }}
          />
          {search ? (
            <button onClick={() => setSearch('')} style={{ padding: '14px 18px', borderRadius: '10px', border: '1px solid rgba(201,168,76,0.25)', background: 'transparent', color: '#B9C4BC', fontSize: '14px', cursor: 'pointer' }}>Clear</button>
          ) : null}
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '14px', alignItems: 'center' }}>
          {POPULAR.map(t => (
            <button key={t} onClick={() => setSearch(t)} style={{ padding: '6px 12px', borderRadius: '999px', border: '1px solid rgba(201,168,76,0.25)', background: 'transparent', color: '#B9C4BC', fontFamily: 'monospace', fontSize: '13px', cursor: 'pointer' }}>{t}</button>
          ))}
        </div>

        {/* Sort toggle + count */}
        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', marginTop: '20px' }}>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ color: '#7E8C83', fontSize: '12px', letterSpacing: '0.08em', textTransform: 'uppercase', marginRight: '4px' }}>Sort by</span>
            {SORTS.map(s => {
              const active = sortKey === s.key
              return (
                <button
                  key={s.key}
                  onClick={() => setSortKey(s.key)}
                  style={{
                    padding: '8px 14px', borderRadius: '999px', cursor: 'pointer', fontSize: '13px',
                    border: '1px solid ' + (active ? '#C9A84C' : 'rgba(201,168,76,0.25)'),
                    background: active ? '#C9A84C' : 'transparent',
                    color: active ? '#07130E' : '#B9C4BC',
                    fontWeight: active ? 700 : 400,
                  }}
                >{s.label}</button>
              )
            })}
          </div>
          {!loading && !error ? (
            <span style={{ color: '#7E8C83', fontSize: '13px' }}>
              {total === 0 ? 'No companies' : `${rangeStart}–${rangeEnd} of ${total}`}
            </span>
          ) : null}
        </div>

        {/* States */}
        {loading && (
          <div style={{ marginTop: '48px', textAlign: 'center', color: '#B9C4BC' }}>Loading insider filings…</div>
        )}

        {!loading && error && (
          <div style={{ marginTop: '40px', padding: '24px', borderRadius: '14px', border: '1px solid rgba(201,168,76,0.2)', background: '#0D1F16', textAlign: 'center', color: '#DFC48B' }}>
            Could not load screener data: {error}
          </div>
        )}

        {!loading && !error && total === 0 && (
          <div style={{ marginTop: '40px', padding: '28px', borderRadius: '14px', border: '1px solid rgba(201,168,76,0.2)', background: '#0D1F16', textAlign: 'center', color: '#B9C4BC', fontSize: '14px', lineHeight: 1.6 }}>
            {debounced
              ? <>No tracked company, ticker, or insider matches “{debounced}”. <Link href="/" style={{ color: '#C9A84C' }}>Browse all signals →</Link></>
              : 'No companies have been imported yet. Run the ingestion pipeline to populate insider filings.'}
          </div>
        )}

        {/* Table */}
        {!loading && !error && total > 0 && (
          <div style={{ marginTop: '22px', border: '1px solid rgba(201,168,76,0.18)', borderRadius: '14px', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1080px' }}>
                <thead>
                  <tr style={{ background: '#0D1F16' }}>
                    {COLS.map(c => (
                      <th key={c.label} style={{ textAlign: c.align, padding: cellPad, fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#C9A84C', fontWeight: 600, borderBottom: '1px solid rgba(201,168,76,0.18)', whiteSpace: 'nowrap' }}>{c.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((r, i) => {
                    const st = statsMap[r.company_id]
                    const net = st?.netValue ?? 0
                    const netColor = net >= 0 ? '#C9A84C' : '#7E8C83'
                    return (
                      <tr key={r.company_id} style={{ borderBottom: '1px solid rgba(201,168,76,0.10)' }}>
                        <td style={{ padding: cellPad, color: '#5E6E64', fontFamily: 'Georgia, serif', fontSize: '15px' }}>{rangeStart + i}</td>
                        <td style={{ padding: cellPad }}>
                          <Link href={'/company/' + r.ticker} style={{ textDecoration: 'none' }}>
                            <span style={{ fontFamily: 'monospace', fontSize: '15px', color: '#F7F4EF' }}>{r.ticker}</span>
                          </Link>
                          <div style={{ color: '#B9C4BC', fontSize: '12px', marginTop: '2px' }}>
                            {truncate(r.name || '', 28)}{r.sector ? ' · ' + r.sector : ''}
                          </div>
                        </td>
                        <td style={{ padding: cellPad, textAlign: 'right' }}>
                          <span style={{ fontFamily: 'Georgia, serif', fontSize: '22px', fontWeight: 800, color: scoreColor(r.score) }}>{r.score}</span>
                          <span style={{ fontSize: '12px', color: '#5E6E64' }}>/100</span>
                        </td>
                        <td style={{ padding: cellPad }}>{filingCell(st?.latestBuy ?? null, 'BUY')}</td>
                        <td style={{ padding: cellPad }}>{filingCell(st?.latestSell ?? null, 'SELL')}</td>
                        <td style={{ padding: cellPad }}>{activityCell(st)}</td>
                        <td style={{ padding: cellPad, textAlign: 'right', fontFamily: 'monospace', fontSize: '14px', color: '#C9A84C' }}>{fmtMoney(st?.totalBuyValue ?? 0)}</td>
                        <td style={{ padding: cellPad, textAlign: 'right', fontFamily: 'monospace', fontSize: '14px', color: '#7E8C83' }}>{fmtMoney(st?.totalSellValue ?? 0)}</td>
                        <td style={{ padding: cellPad, textAlign: 'right', fontFamily: 'monospace', fontSize: '14px', fontWeight: 700, color: netColor }}>{fmtMoney(net)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pagination */}
        {!loading && !error && total > PAGE_SIZE && (
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', justifyContent: 'center', marginTop: '24px' }}>
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={safePage === 0}
              style={{ padding: '10px 18px', borderRadius: '10px', border: '1px solid rgba(201,168,76,0.25)', background: 'transparent', color: safePage === 0 ? '#5E6E64' : '#B9C4BC', fontSize: '14px', cursor: safePage === 0 ? 'default' : 'pointer' }}
            >← Prev</button>
            <span style={{ color: '#7E8C83', fontSize: '13px' }}>Page {safePage + 1} of {pageCount}</span>
            <button
              onClick={() => setPage(p => Math.min(pageCount - 1, p + 1))}
              disabled={safePage >= pageCount - 1}
              style={{ padding: '10px 18px', borderRadius: '10px', border: '1px solid rgba(201,168,76,0.25)', background: 'transparent', color: safePage >= pageCount - 1 ? '#5E6E64' : '#B9C4BC', fontSize: '14px', cursor: safePage >= pageCount - 1 ? 'default' : 'pointer' }}
            >Next →</button>
          </div>
        )}
      </main>

      <footer style={{ borderTop: '1px solid rgba(201,168,76,0.15)', padding: '24px', textAlign: 'center', color: '#5E6E64', fontSize: '12px' }}>
        Source: SEC EDGAR Form 4 filings. Scores generated by The Hidden Ledger ranking engine. Not financial advice.
      </footer>
    </div>
  )
}
