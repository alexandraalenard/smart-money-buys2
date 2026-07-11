'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import Link from 'next/link'

interface Ranking {
  id: string
  ticker: string
  company_id: string
  score: number
  insider_conviction: number
  leadership_alignment: number
  historical_edge: number
  capital_commitment: number
  ai_opportunity: number
  ai_summary: string
  companies: {
    name: string
    sector: string
  }
}

export default function Home() {
  const [rankings, setRankings] = useState<Ranking[]>([])
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => { fetchRankings() }, [])

  async function fetchRankings() {
    // 1. Pull the real scored companies from the `rankings` table
    //    (this is where the live scores actually live).
    const { data: rankingRows } = await supabase
      .from('rankings')
      .select('id, ticker, company_id, score, insider_conviction, leadership_alignment, historical_edge, capital_commitment, ai_opportunity, ai_summary')
      .not('score', 'is', null)
      .order('score', { ascending: false })

    const rows = rankingRows || []

    // 2. Look up company names and sectors for those rankings.
    const companyIds = rows.map((r) => r.company_id).filter(Boolean)
    let companyById: Record<string, { name: string; sector: string }> = {}

    if (companyIds.length > 0) {
      const { data: companyRows } = await supabase
        .from('companies')
        .select('id, name, sector')
        .in('id', companyIds)

      companyById = Object.fromEntries(
        (companyRows || []).map((c) => [c.id, { name: c.name, sector: c.sector }])
      )
    }

    // 3. Attach a `companies` object to each ranking so the UI can read
    //    r.companies.name / r.companies.sector. Falls back to the ticker
    //    if a company record isn't found.
    const merged = rows.map((r) => ({
      ...r,
      companies: companyById[r.company_id] || { name: r.ticker, sector: '' },
    })) as Ranking[]

    setRankings(merged)
    setLoading(false)
  }

  function getScoreColor(score: number) {
    if (score >= 80) return '#C9A84C'
    if (score >= 60) return '#DFC48B'
    if (score >= 40) return '#2D6A4F'
    return '#4a5568'
  }

  function getScoreLabel(score: number) {
    if (score >= 85) return 'Exceptional'
    if (score >= 70) return 'Strong Signal'
    if (score >= 50) return 'Worth Watching'
    if (score >= 30) return 'Moderate'
    return 'Weak Signal'
  }

  const filtered = rankings.filter(r => {
    if (!search.trim()) return true
    const q = search.trim().toLowerCase()
    const co = r.companies || { name: r.ticker, sector: '' }
    return r.ticker.toLowerCase().includes(q) || co.name.toLowerCase().includes(q)
  })

  const stats = [
    { value: String(rankings.length || 0), label: 'Companies Tracked' },
    { value: String(rankings.filter(r => r.score >= 50).length), label: 'Active Signals (50+)' },
    { value: 'SEC EDGAR', label: 'Data Source' },
    { value: 'Form 4', label: 'Filing Type' },
  ]

  return (
    <main style={{ background: '#07130E', minHeight: '100vh', fontFamily: "'Inter', sans-serif", color: '#F7F4EF' }}>

      {/* NAV */}
      <nav style={{ background: '#1B4332', borderBottom: '1px solid #2D6A4F', padding: '0 48px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '32px', height: '32px', background: '#2D6A4F', border: '1px solid #C9A84C', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>📒</div>
          <div>
            <span style={{ fontWeight: 700, fontSize: '14px', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#F7F4EF' }}>THE </span>
            <span style={{ fontStyle: 'italic', fontSize: '14px', color: '#C9A84C', fontWeight: 400 }}>HIDDEN </span>
            <span style={{ fontWeight: 700, fontSize: '14px', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#F7F4EF' }}>LEDGER</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
          <Link href="/" style={{ fontSize: '13px', color: '#DFC48B', letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer', textDecoration: 'none' }}>Signals</Link>
          <Link href="/sell-alerts" style={{ fontSize: '13px', color: '#C9A84C', letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer', textDecoration: 'none', fontWeight: 700 }}>Sell Alerts</Link>
          <Link href="/market-pulse" style={{ fontSize: '13px', color: '#DFC48B', letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer', textDecoration: 'none' }}>Market Pulse</Link>
          <Link href="/stock-screener" style={{ fontSize: '13px', color: '#DFC48B', letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer', textDecoration: 'none' }}>Screener</Link>
          <Link href="/billionaires-corner" style={{ fontSize: '13px', color: '#DFC48B', letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer', textDecoration: 'none' }}>Billionaires</Link>
          <Link href="/buyers-corner" style={{ fontSize: '13px', color: '#DFC48B', letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer', textDecoration: 'none' }}>Buyers Corner</Link>
          <Link href="/pricing" style={{ background: '#C9A84C', color: '#07130E', border: 'none', padding: '8px 20px', borderRadius: '6px', fontSize: '12px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer', textDecoration: 'none' }}>Subscribe</Link>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ background: 'linear-gradient(180deg, #1B4332 0%, #07130E 100%)', padding: '96px 48px 80px', borderBottom: '1px solid #2D6A4F' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '64px', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'inline-block', background: '#2D6A4F', border: '1px solid #C9A84C', borderRadius: '100px', padding: '4px 14px', marginBottom: '28px' }}>
              <span style={{ fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#C9A84C', fontWeight: 600 }}>Follow the money. Find the signal.</span>
            </div>
            <h1 style={{ fontSize: '52px', lineHeight: 1.1, fontWeight: 700, marginBottom: '12px', fontFamily: 'Georgia, serif' }}>The information</h1>
            <h1 style={{ fontSize: '52px', lineHeight: 1.1, fontStyle: 'italic', color: '#C9A84C', marginBottom: '24px', fontFamily: 'Georgia, serif', fontWeight: 400 }}>they acted on.</h1>
            <p style={{ fontSize: '18px', color: '#DFC48B', lineHeight: 1.7, marginBottom: '40px', maxWidth: '480px' }}>
              Smart Money Buys tracks SEC Form 4 filings, congressional disclosures and institutional 13F filings — then ranks every signal by AI confidence score.
            </p>
            <div style={{ display: 'flex', gap: '16px' }}>
              <button style={{ background: '#C9A84C', color: '#07130E', border: 'none', padding: '14px 32px', borderRadius: '6px', fontSize: '14px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer' }}>View Today&apos;s Signals</button>
              <button style={{ background: 'transparent', color: '#F7F4EF', border: '1px solid #2D6A4F', padding: '14px 32px', borderRadius: '6px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>How It Works</button>
            </div>
          </div>

          {/* Live signal card */}
          <div style={{ background: '#1B4332', border: '1px solid #2D6A4F', borderRadius: '12px', padding: '28px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, #C9A84C, #DFC48B)' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
              <div>
                <div style={{ fontSize: '10px', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#C9A84C', marginBottom: '6px', fontWeight: 600 }}>Top Signal</div>
                <div style={{ fontFamily: 'monospace', fontSize: '22px', fontWeight: 700, color: '#F7F4EF' }}>{rankings[0]?.ticker || '—'}</div>
                <div style={{ fontSize: '13px', color: '#DFC48B', marginTop: '4px' }}>{rankings[0]?.companies?.name || 'Loading…'}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#C9A84C', marginBottom: '4px' }}>AI Score</div>
                <div style={{ fontSize: '36px', fontWeight: 800, color: '#C9A84C', lineHeight: 1 }}>{rankings[0]?.score ?? '—'}</div>
                <div style={{ fontSize: '11px', color: '#DFC48B' }}>/ 100</div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '20px' }}>
              {[['AI Score', rankings[0] ? rankings[0].score + '/100' : '—'], ['Sector', rankings[0]?.companies?.sector || '—'], ['Rank', '#1']].map(([label, val]) => (
                <div key={label} style={{ background: '#2D6A4F', borderRadius: '8px', padding: '10px 12px' }}>
                  <div style={{ fontSize: '10px', color: '#C9A84C', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '4px' }}>{label}</div>
                  <div style={{ fontFamily: 'monospace', fontSize: '13px', fontWeight: 600, color: '#F7F4EF' }}>{val}</div>
                </div>
              ))}
            </div>
            <div style={{ fontSize: '11px', color: '#2D6A4F', borderTop: '1px solid #2D6A4F', paddingTop: '12px' }}>
              Source: SEC Form 4 · Public Disclosure* · <span style={{ color: '#C9A84C', cursor: 'pointer' }}>View full filing →</span>
            </div>
          </div>
        </div>
      </section>

      {/* STATS BAR */}
      <section style={{ background: '#1B4332', borderBottom: '1px solid #2D6A4F', padding: '28px 48px' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px' }}>
          {stats.map(({ value, label }) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'monospace', fontSize: '28px', fontWeight: 700, color: '#C9A84C' }}>{value}</div>
              <div style={{ fontSize: '12px', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#DFC48B', marginTop: '4px' }}>{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ALL SIGNALS */}
      <section style={{ padding: '72px 48px', maxWidth: '1280px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px' }}>
          <div>
            <div style={{ fontSize: '11px', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#C9A84C', marginBottom: '10px', fontWeight: 600 }}>AI-Ranked · Updated Daily</div>
            <h2 style={{ fontSize: '36px', fontFamily: 'Georgia, serif', fontWeight: 700, color: '#F7F4EF', margin: 0 }}>Today&apos;s Top Signals</h2>
          </div>
          <div style={{ fontSize: '13px', color: '#2D6A4F', fontStyle: 'italic' }}>Ranked by AI Confidence Score</div>
        </div>

        {/* SEARCH BAR */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ position: 'relative', maxWidth: '400px' }}>
            <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#2D6A4F', fontSize: '14px' }}>🔍</span>
            <input
              type="text"
              placeholder="Search by ticker or company name..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', background: '#1B4332', border: '1px solid #2D6A4F', borderRadius: '8px', padding: '12px 16px 12px 40px', color: '#F7F4EF', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
          {search.trim() && (
            <div style={{ marginTop: '8px', fontSize: '12px', color: '#2D6A4F' }}>
              {filtered.length} result{filtered.length !== 1 ? 's' : ''} for &ldquo;{search}&rdquo;
            </div>
          )}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px', color: '#2D6A4F', fontStyle: 'italic' }}>Scanning SEC filings...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px', color: '#2D6A4F' }}>
            {search.trim() ? 'No results found. Try a different search.' : 'No signals yet. Run the scoring engine to populate rankings.'}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filtered.map((r, i) => {
              const company = r.companies || { name: r.ticker, sector: 'Unknown' }
              return (
                <Link href={'/company/' + r.ticker} key={r.id} style={{ textDecoration: 'none' }}>
                  <div style={{
                    background: '#1B4332',
                    border: '1px solid ' + (i === 0 && !search.trim() ? '#C9A84C' : '#2D6A4F'),
                    borderRadius: '10px',
                    padding: '24px 28px',
                    display: 'grid',
                    gridTemplateColumns: '48px 1fr auto',
                    gap: '24px',
                    alignItems: 'center',
                    cursor: 'pointer',
                    position: 'relative',
                    overflow: 'hidden',
                  }}>
                    {i === 0 && !search.trim() && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, #C9A84C, #DFC48B)' }} />}
                    <div style={{ fontFamily: 'Georgia, serif', fontSize: '28px', fontWeight: 700, color: i === 0 && !search.trim() ? '#C9A84C' : '#2D6A4F' }}>#{i + 1}</div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
                        <span style={{ fontFamily: 'monospace', fontSize: '18px', fontWeight: 700, color: '#F7F4EF' }}>{r.ticker}</span>
                        <span style={{ fontSize: '15px', color: '#DFC48B' }}>{company.name}</span>
                        <span style={{ background: '#2D6A4F', border: '1px solid #C9A84C', borderRadius: '100px', padding: '2px 10px', fontSize: '10px', color: '#C9A84C', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{company.sector}</span>
                      </div>
                      <div style={{ fontSize: '13px', color: '#DFC48B', fontStyle: 'italic' }}>{r.ai_summary || 'Ranked on recent SEC Form 4 insider filing activity.'}</div>
                      <div style={{ display: 'flex', gap: '16px', marginTop: '12px' }}>
                        {[
                          { label: 'Insider', val: r.insider_conviction },
                          { label: 'Leadership', val: r.leadership_alignment },
                          { label: 'Historical', val: r.historical_edge },
                          { label: 'Capital', val: r.capital_commitment },
                          { label: 'AI Rating', val: r.ai_opportunity },
                        ].map(({ label, val }) => (
                          <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <div style={{ fontSize: '10px', color: '#C9A84C', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{label}</div>
                            <div style={{ width: '60px', height: '4px', background: '#07130E', borderRadius: '2px', overflow: 'hidden' }}>
                              <div style={{ width: (val || 0) + '%', height: '100%', background: '#C9A84C', borderRadius: '2px' }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '42px', fontWeight: 800, color: getScoreColor(r.score), lineHeight: 1 }}>{r.score}</div>
                      <div style={{ fontSize: '11px', color: '#DFC48B', marginTop: '2px' }}>/ 100</div>
                      <div style={{ fontSize: '11px', color: getScoreColor(r.score), marginTop: '6px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{getScoreLabel(r.score)}</div>
                      <div style={{ fontSize: '11px', color: '#2D6A4F', marginTop: '8px' }}>View full signal →</div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </section>

      {/* EMAIL SIGNUP */}
      <section style={{ background: '#1B4332', borderTop: '1px solid #2D6A4F', borderBottom: '1px solid #2D6A4F', padding: '72px 48px' }}>
        <div style={{ maxWidth: '640px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: '11px', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#C9A84C', marginBottom: '16px', fontWeight: 600 }}>The Weekly Ledger</div>
          <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '32px', fontWeight: 700, color: '#F7F4EF', marginBottom: '12px' }}>5 filings worth watching<br /><span style={{ fontStyle: 'italic', color: '#C9A84C' }}>before Monday.</span></h2>
          <p style={{ color: '#DFC48B', fontSize: '15px', lineHeight: 1.7, marginBottom: '32px' }}>Every weekend we send the top-ranked insider signals direct to your inbox. No noise. Just the trades worth watching.</p>
          {subscribed ? (
            <div style={{ background: '#2D6A4F', border: '1px solid #C9A84C', borderRadius: '8px', padding: '16px 24px', color: '#C9A84C', fontWeight: 600 }}>You&apos;re on the list. Watch your inbox.</div>
          ) : (
            <div style={{ display: 'flex', gap: '12px', maxWidth: '440px', margin: '0 auto' }}>
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                style={{ flex: 1, background: '#07130E', border: '1px solid #2D6A4F', borderRadius: '6px', padding: '12px 16px', color: '#F7F4EF', fontSize: '14px', outline: 'none' }}
              />
              <button
                onClick={() => email && setSubscribed(true)}
                style={{ background: '#C9A84C', color: '#07130E', border: 'none', padding: '12px 24px', borderRadius: '6px', fontSize: '13px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer', whiteSpace: 'nowrap' }}
              >
                Get Signals
              </button>
            </div>
          )}
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ padding: '40px 48px', borderTop: '1px solid #1B4332' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '12px', color: '#2D6A4F' }}>2026 Smart Money Buys · All rights reserved</div>
          <div style={{ fontSize: '11px', color: '#2D6A4F', maxWidth: '600px', lineHeight: 1.6 }}>
            * Source: SEC Form 4 — public insider trading disclosures · ** House/Senate financial disclosure filings, Office of the Clerk · All data is publicly available. Not financial advice.
          </div>
        </div>
      </footer>
    </main>
  )
}
