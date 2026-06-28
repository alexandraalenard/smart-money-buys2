'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { supabase } from '../../lib/supabase'
import { nameMatches, txValue, fmtNetWorth, fmtMoney, fmtDate, categoryLabel, type BillTx } from './billionaires'

interface Profile {
  id: string
  name: string
  category: string | null
  country: string | null
  net_worth_usd: number | null
  firm: string | null
  rank: number | null
  bio: string | null
  updated_at: string | null
}

interface Insider {
  id: string
  name: string
  company_id: string | null
}

interface PortfolioStat {
  holdings: number   // distinct companies with verified filings
  value: number      // total verified Form 4 value
}

const CATS = [
  { id: 'all', label: 'All' },
  { id: 'richest', label: 'Top Richest' },
  { id: 'affluent', label: 'Affluent' },
  { id: 'entrepreneur', label: 'Entrepreneurs' },
  { id: 'tech', label: 'Tech Leaders' },
]

// Brand palette only — no new colors.
const DK = '#07130E', LT = '#F7F4EF', G = '#C9A84C', GN = '#2D6A4F', DG = '#1B4332'
const MD = '#DFC48B', CARD = '#0D1F16', MUTED = '#B9C4BC', DIM = '#7E8C83'

export default function BillionairesCornerPage() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [stats, setStats] = useState<Record<string, PortfolioStat>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cat, setCat] = useState('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const [profRes, insRes] = await Promise.all([
          supabase.from('billionaire_profiles').select('id, name, category, country, net_worth_usd, firm, rank, bio, updated_at'),
          supabase.from('insiders').select('id, name, company_id'),
        ])
        if (profRes.error) throw profRes.error
        if (insRes.error) throw insRes.error
        if (cancelled) return

        const profs = (profRes.data || []) as Profile[]
        const insiders = (insRes.data || []) as Insider[]

        // Match each profile's name to insiders, then pull their Form 4 rows in
        // one bounded query to compute "public portfolio size where available".
        const matchByProfile: Record<string, string[]> = {}
        const allIds = new Set<string>()
        for (const p of profs) {
          const ids = insiders.filter(i => nameMatches(p.name, i.name)).map(i => i.id)
          matchByProfile[p.id] = ids
          ids.forEach(id => allIds.add(id))
        }

        const statMap: Record<string, PortfolioStat> = {}
        if (allIds.size > 0) {
          const { data: txData, error: txErr } = await supabase
            .from('insider_transactions')
            .select('insider_id, company_id, total_value, shares, price_per_share')
            .in('insider_id', Array.from(allIds))
          if (txErr) throw txErr
          if (cancelled) return
          const byInsider: Record<string, BillTx[]> = {}
          for (const t of (txData || []) as BillTx[]) {
            if (t.insider_id) (byInsider[t.insider_id] ||= []).push(t)
          }
          for (const p of profs) {
            const txs = matchByProfile[p.id].flatMap(id => byInsider[id] || [])
            if (!txs.length) continue
            const companies = new Set(txs.map(t => t.company_id).filter(Boolean) as string[])
            statMap[p.id] = { holdings: companies.size, value: txs.reduce((s, t) => s + txValue(t), 0) }
          }
        }

        setStats(statMap)
        setProfiles(profs)
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load billionaire profiles')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    const list = profiles.filter(p =>
      (cat === 'all' || (p.category || '').toLowerCase() === cat) &&
      (!q || p.name.toLowerCase().includes(q) || (p.firm || '').toLowerCase().includes(q))
    )
    return [...list].sort((a, b) => {
      if (a.rank != null && b.rank != null && a.rank !== b.rank) return a.rank - b.rank
      if (a.rank != null && b.rank == null) return -1
      if (a.rank == null && b.rank != null) return 1
      const nw = (b.net_worth_usd || 0) - (a.net_worth_usd || 0)
      if (nw) return nw
      return a.name.localeCompare(b.name)
    })
  }, [profiles, cat, search])

  return (
    <main style={{ background: DK, minHeight: '100vh', fontFamily: "'Inter', sans-serif", color: LT }}>
      <nav style={{ background: DG, borderBottom: `1px solid ${GN}`, padding: '0 32px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '32px', height: '32px', background: GN, border: `1px solid ${G}`, borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>📒</div>
          <div><span style={{ fontWeight: 700, fontSize: '14px', letterSpacing: '0.08em', textTransform: 'uppercase', color: LT }}>THE </span><span style={{ fontStyle: 'italic', fontSize: '14px', color: G }}>HIDDEN </span><span style={{ fontWeight: 700, fontSize: '14px', letterSpacing: '0.08em', textTransform: 'uppercase', color: LT }}>LEDGER</span></div>
        </Link>
        <div style={{ display: 'flex', gap: '24px', alignItems: 'center', flexWrap: 'wrap' }}>
          <Link href="/" style={{ fontSize: '13px', color: MD, textTransform: 'uppercase', textDecoration: 'none' }}>Signals</Link>
          <Link href="/sell-alerts" style={{ fontSize: '13px', color: MD, textTransform: 'uppercase', textDecoration: 'none' }}>Sell Alerts</Link>
          <Link href="/buyers-corner" style={{ fontSize: '13px', color: MD, textTransform: 'uppercase', textDecoration: 'none' }}>Buyers Corner</Link>
          <Link href="/billionaires-corner" style={{ fontSize: '13px', color: G, textTransform: 'uppercase', textDecoration: 'none', fontWeight: 700 }}>Billionaires</Link>
          <Link href="/market-pulse" style={{ fontSize: '13px', color: MD, textTransform: 'uppercase', textDecoration: 'none' }}>Market Pulse</Link>
          <Link href="/pricing" style={{ background: G, color: DK, padding: '8px 20px', borderRadius: '6px', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', textDecoration: 'none' }}>Subscribe</Link>
        </div>
      </nav>

      <section style={{ background: 'linear-gradient(180deg,#1B4332 0%,#07130E 100%)', padding: '48px 32px 32px', textAlign: 'center' }}>
        <div style={{ display: 'inline-block', background: GN, border: `1px solid ${G}`, borderRadius: '100px', padding: '4px 16px', marginBottom: '16px', fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase', color: G, fontWeight: 600 }}>Smart Money Tracker</div>
        <h1 style={{ fontFamily: 'Georgia,serif', fontSize: '40px', fontWeight: 700, color: LT, marginBottom: '12px' }}>Billionaires Corner</h1>
        <p style={{ color: MD, fontSize: '15px', maxWidth: '600px', margin: '0 auto 20px', lineHeight: 1.7 }}>
          Profiles with verified holdings sourced from SEC Form 4 filings. Net-worth and category data are estimates from our records — only filings are shown as fact.
        </p>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or firm..." style={{ background: DG, border: `1px solid ${GN}`, borderRadius: '8px', padding: '10px 16px', color: LT, fontSize: '14px', width: '100%', maxWidth: '400px', outline: 'none' }} />
      </section>

      <section style={{ padding: '16px 32px', display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center', borderBottom: `1px solid ${GN}` }}>
        {CATS.map(c => (
          <button key={c.id} onClick={() => setCat(c.id)} style={{ background: cat === c.id ? G : 'transparent', color: cat === c.id ? DK : MD, border: `1px solid ${cat === c.id ? G : GN}`, borderRadius: '100px', padding: '6px 16px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', textTransform: 'uppercase' }}>{c.label}</button>
        ))}
      </section>

      <section style={{ padding: '24px 32px', maxWidth: '1100px', margin: '0 auto' }}>
        {loading && <div style={{ color: MUTED, textAlign: 'center', padding: '48px 0' }}>Loading profiles…</div>}

        {!loading && error && (
          <div style={{ color: MD, textAlign: 'center', padding: '32px', border: `1px solid ${GN}`, borderRadius: '12px', background: CARD }}>Could not load profiles: {error}</div>
        )}

        {!loading && !error && (
          <>
            <p style={{ color: DIM, fontSize: '12px', marginBottom: '16px' }}>{filtered.length} {filtered.length === 1 ? 'profile' : 'profiles'}</p>

            {filtered.length === 0 ? (
              <div style={{ color: MUTED, fontFamily: 'Georgia, serif', fontStyle: 'italic', padding: '48px 0', textAlign: 'center' }}>
                {profiles.length === 0 ? 'No billionaire profiles loaded yet.' : 'No profiles match your search.'}
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '12px' }}>
                {filtered.map(p => {
                  const st = stats[p.id]
                  return (
                    <div key={p.id} style={{ background: CARD, border: `1px solid ${GN}`, borderRadius: '10px', padding: '20px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                            <span style={{ fontWeight: 700, fontSize: '18px', color: LT }}>{p.name}</span>
                            <span style={{ border: `1px solid ${GN}`, color: G, borderRadius: '100px', padding: '2px 10px', fontSize: '11px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{categoryLabel(p.category)}</span>
                            {p.country ? <span style={{ color: DIM, fontSize: '12px' }}>{p.country}</span> : null}
                          </div>
                          <div style={{ marginTop: '10px', display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                            <div>
                              <div style={{ fontSize: '10px', color: DIM, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Net Worth</div>
                              <div style={{ color: p.net_worth_usd ? G : DIM, fontSize: '14px', fontWeight: 600 }}>{fmtNetWorth(p.net_worth_usd)}</div>
                            </div>
                            <div>
                              <div style={{ fontSize: '10px', color: DIM, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Source of Wealth</div>
                              <div style={{ color: p.firm ? LT : DIM, fontSize: '14px' }}>{p.firm || 'Not available'}</div>
                            </div>
                            <div>
                              <div style={{ fontSize: '10px', color: DIM, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Verified Holdings</div>
                              <div style={{ color: st ? LT : DIM, fontSize: '14px' }}>{st ? `${st.holdings} · ${fmtMoney(st.value)}` : 'None yet'}</div>
                            </div>
                            <div>
                              <div style={{ fontSize: '10px', color: DIM, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Last Updated</div>
                              <div style={{ color: MUTED, fontSize: '14px' }}>{p.updated_at ? fmtDate(p.updated_at) : '—'}</div>
                            </div>
                          </div>
                        </div>
                        <Link href={`/billionaires-corner/${p.id}`} style={{ background: G, color: DK, padding: '10px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap' }}>View holdings →</Link>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}
      </section>

      <footer style={{ borderTop: `1px solid ${GN}`, padding: '24px 32px', textAlign: 'center', color: '#5E6E64', fontSize: '12px' }}>
        Holdings sourced from SEC EDGAR Form 4 filings, matched by filer name. Net-worth figures are estimates, not SEC data. Not financial advice.
      </footer>
    </main>
  )
}
