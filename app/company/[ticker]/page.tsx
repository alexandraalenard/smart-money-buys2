'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '../../../lib/supabase'
import Link from 'next/link'

interface Trade {
  id: string
  insider_id: string
  transaction_type: string
  shares: number
  price: number
  transaction_date: string
  source_type: string
  insiders: {
    name: string
    title: string
  } | null
}

interface Company {
  id: string
  ticker: string
  name: string
  sector: string
  description: string
}

interface Ranking {
  score: number
  insider_conviction: number
  leadership_alignment: number
  historical_edge: number
  capital_commitment: number
  ai_opportunity: number
  ai_summary: string
  ai_reasons: string[]
  updated_at: string
}

export default function CompanyPage() {
  const params = useParams()
  const ticker = (params?.ticker as string)?.toUpperCase()
  const [company, setCompany] = useState<Company | null>(null)
  const [ranking, setRanking] = useState<Ranking | null>(null)
  const [trades, setTrades] = useState<Trade[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (ticker) fetchData()
  }, [ticker])

  async function fetchData() {
    const { data: companyData } = await supabase
      .from('companies')
      .select('*')
      .eq('ticker', ticker)
      .single()
    if (companyData) {
      setCompany(companyData)
      const { data: rankingData } = await supabase
        .from('rankings').select('*').eq('ticker', ticker).single()
      if (rankingData) setRanking(rankingData)
      const { data: tradesData } = await supabase
        .from('trades')
        .select('*, insiders(name, title)')
        .eq('company_id', companyData.id)
        .order('transaction_date', { ascending: false })
        .limit(20)
      if (tradesData) setTrades(tradesData)
    }
    setLoading(false)
  }

  function getScoreColor(s: number) {
    if (s >= 80) return '#C9A84C'
    if (s >= 60) return '#DFC48B'
    return '#2D6A4F'
  }

  function fmtVal(shares: number, price: number) {
    if (!shares || !price) return 'N/A'
    const v = shares * price
    if (v >= 1000000) return '$' + (v / 1000000).toFixed(1) + 'M'
    if (v >= 1000) return '$' + (v / 1000).toFixed(0) + 'K'
    return '$' + v.toLocaleString()
  }

  function txLabel(type: string) {
    const t = (type || '').toUpperCase()
    if (t === 'P' || t === 'BUY') return 'BUY'
    if (t === 'S' || t === 'SELL') return 'SELL'
    if (t === 'A') return 'AWARD'
    if (t === 'M') return 'EXERCISE'
    return t || 'N/A'
  }

  function isBuy(type: string) {
    const t = (type || '').toUpperCase()
    return t === 'P' || t === 'BUY' || t === 'A' || t === 'M'
  }

  function fmtDate(d: string) {
    if (!d) return 'N/A'
    try { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) }
    catch { return d }
  }

  // Estimated annual compensation by title (USD)
  // Used to calculate how many years of salary this trade represents
  function getEstimatedSalary(title: string): number {
    const t = (title || '').toUpperCase()
    if (t.includes('CEO') || t.includes('CHIEF EXECUTIVE')) return 5000000
    if (t.includes('CFO') || t.includes('CHIEF FINANCIAL')) return 3500000
    if (t.includes('COO') || t.includes('CHIEF OPERATING')) return 3000000
    if (t.includes('CTO') || t.includes('CHIEF TECHNOLOGY')) return 2500000
    if (t.includes('PRESIDENT')) return 2500000
    if (t.includes('EVP') || t.includes('EXECUTIVE VICE')) return 2000000
    if (t.includes('SVP') || t.includes('SENIOR VICE')) return 1500000
    if (t.includes('VP') || t.includes('VICE PRESIDENT')) return 1000000
    if (t.includes('DIRECTOR')) return 400000
    if (t.includes('CHAIRMAN') || t.includes('CHAIR')) return 600000
    return 500000
  }

  function getConvictionRatio(shares: number, price: number, title: string): string {
    if (!shares || !price) return '—'
    const val = shares * price
    const salary = getEstimatedSalary(title)
    if (!salary) return '—'
    const ratio = val / salary
    if (ratio >= 5) return ratio.toFixed(1) + 'x 🔥'
    if (ratio >= 2) return ratio.toFixed(1) + 'x ⚡'
    if (ratio >= 0.5) return ratio.toFixed(2) + 'x'
    if (ratio >= 0.1) return ratio.toFixed(2) + 'x'
    return '<0.1x'
  }

  const scoreComponents = ranking ? [
    { label: 'Insider Conviction', desc: 'How significant were the purchases?', val: ranking.insider_conviction },
    { label: 'Leadership Alignment', desc: 'Did multiple senior executives buy?', val: ranking.leadership_alignment },
    { label: 'Historical Edge', desc: 'How often has this pattern worked?', val: ranking.historical_edge },
    { label: 'Capital Commitment', desc: 'How much personal money is at stake?', val: ranking.capital_commitment },
    { label: 'AI Opportunity Rating', desc: 'Overall AI assessment', val: ranking.ai_opportunity },
  ] : []

  const aiReasons = (ranking?.ai_reasons && ranking.ai_reasons.length) ? ranking.ai_reasons : ((ranking?.score || 0) >= 70 ? [
    'Significant insider purchases detected',
    'No insider selling in previous 12 months',
    'Pattern historically associated with outperformance',
  ] : (ranking?.score || 0) >= 50 ? [
    'Mixed insider activity worth monitoring',
    'Some notable transactions on record',
    'Watch for follow-through buying',
  ] : [
    'Recent filings are mostly sales or share grants',
    'No significant open-market buying detected',
    'Limited insider conviction at this time',
  ])

  if (loading) return (
    <main style={{ background: '#07130E', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: '#C9A84C', fontStyle: 'italic', fontFamily: 'Georgia, serif', fontSize: '20px' }}>Retrieving filing data...</div>
    </main>
  )

  if (!company) return (
    <main style={{ background: '#07130E', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px' }}>
      <div style={{ color: '#F7F4EF', fontSize: '24px', fontFamily: 'Georgia, serif' }}>No data found for {ticker}</div>
      <Link href="/" style={{ color: '#C9A84C', textDecoration: 'none', fontSize: '14px' }}>Back to signals</Link>
    </main>
  )

  return (
    <main style={{ background: '#07130E', minHeight: '100vh', fontFamily: "'Inter', sans-serif", color: '#F7F4EF' }}>
      <nav style={{ background: '#1B4332', borderBottom: '1px solid #2D6A4F', padding: '0 48px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '32px', height: '32px', background: '#2D6A4F', border: '1px solid #C9A84C', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>📒</div>
          <div>
            <span style={{ fontWeight: 700, fontSize: '14px', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#F7F4EF' }}>THE </span>
            <span style={{ fontStyle: 'italic', fontSize: '14px', color: '#C9A84C' }}>HIDDEN </span>
            <span style={{ fontWeight: 700, fontSize: '14px', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#F7F4EF' }}>LEDGER</span>
          </div>
        </Link>
        <Link href="/" style={{ color: '#DFC48B', textDecoration: 'none', fontSize: '13px' }}>Back to All Signals</Link>
      </nav>

      <section style={{ background: 'linear-gradient(180deg, #1B4332 0%, #07130E 100%)', padding: '64px 48px 56px', borderBottom: '1px solid #2D6A4F' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr auto', gap: '48px', alignItems: 'start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
              <span style={{ fontFamily: 'monospace', fontSize: '36px', fontWeight: 800, color: '#F7F4EF' }}>{company.ticker}</span>
              <span style={{ background: '#2D6A4F', border: '1px solid #C9A84C', borderRadius: '100px', padding: '4px 14px', fontSize: '11px', color: '#C9A84C', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{company.sector}</span>
            </div>
            <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '40px', fontWeight: 700, color: '#F7F4EF', marginBottom: '16px', lineHeight: 1.2 }}>{company.name}</h1>
            <p style={{ color: '#DFC48B', fontSize: '16px', lineHeight: 1.7, maxWidth: '560px' }}>{company.description || 'Tracking insider activity and filings for this company.'}</p>
          </div>
          {ranking && (
            <div style={{ background: '#1B4332', border: '2px solid ' + getScoreColor(ranking.score), borderRadius: '12px', padding: '32px', textAlign: 'center', minWidth: '220px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, #C9A84C, #DFC48B)' }} />
              <div style={{ fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#C9A84C', marginBottom: '8px', fontWeight: 600 }}>AI Confidence Score</div>
              <div style={{ fontSize: '80px', fontWeight: 900, color: getScoreColor(ranking.score), lineHeight: 1 }}>{ranking.score}</div>
              <div style={{ fontSize: '14px', color: '#DFC48B', marginBottom: '16px' }}>/ 100</div>
              <div style={{ background: '#2D6A4F', borderRadius: '6px', padding: '8px 16px', fontSize: '12px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#C9A84C' }}>
                {ranking.score >= 85 ? 'Exceptional Signal' : ranking.score >= 70 ? 'Strong Signal' : ranking.score >= 50 ? 'Worth Watching' : 'Moderate'}
              </div>
            </div>
          )}
        </div>
      </section>

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '56px 48px', display: 'grid', gridTemplateColumns: '1fr 400px', gap: '48px', alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>

          {ranking && (
            <div style={{ background: '#1B4332', border: '1px solid #2D6A4F', borderRadius: '10px', padding: '28px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '3px', background: '#C9A84C' }} />
              <div style={{ fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#C9A84C', marginBottom: '12px', fontWeight: 600 }}>{(ranking.score || 0) >= 50 ? 'Why this ranked highly' : 'Insider activity analysis'}</div>
              <p style={{ fontFamily: 'Georgia, serif', fontSize: '17px', lineHeight: 1.8, color: '#F7F4EF', fontStyle: 'italic', marginBottom: '20px' }}>
                {ranking.ai_summary || ((ranking.score || 0) >= 70 ? 'Multiple senior insiders have made significant purchases, signalling strong confidence in the company outlook.' : (ranking.score || 0) >= 50 ? 'Insiders show mixed but notable activity worth monitoring.' : 'Recent insider filings are mostly routine sales or share grants, with limited open-market buying.')}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {aiReasons.map((r, i) => (
                  <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                    <span style={{ color: '#C9A84C', fontWeight: 700, fontSize: '13px', marginTop: '1px' }}>+</span>
                    <span style={{ fontSize: '14px', color: '#DFC48B' }}>{r}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {ranking && scoreComponents.length > 0 && (
            <div>
              <div style={{ fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#C9A84C', marginBottom: '20px', fontWeight: 600 }}>Score Breakdown</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {scoreComponents.map(({ label, desc, val }) => (
                  <div key={label} style={{ background: '#1B4332', border: '1px solid #2D6A4F', borderRadius: '8px', padding: '16px 20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: '#F7F4EF' }}>{label}</div>
                        <div style={{ fontSize: '12px', color: '#DFC48B', marginTop: '2px' }}>{desc}</div>
                      </div>
                      <div style={{ fontFamily: 'monospace', fontSize: '22px', fontWeight: 700, color: getScoreColor(val || 0) }}>{val || 0}</div>
                    </div>
                    <div style={{ height: '6px', background: '#07130E', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: (val || 0) + '%', height: '100%', background: 'linear-gradient(90deg, #2D6A4F, ' + getScoreColor(val || 0) + ')', borderRadius: '3px' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <div style={{ fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#C9A84C', marginBottom: '20px', fontWeight: 600 }}>Recent Filings</div>
            {trades.length === 0 ? (
              <div style={{ background: '#1B4332', border: '1px solid #2D6A4F', borderRadius: '10px', padding: '40px', textAlign: 'center', color: '#2D6A4F', fontStyle: 'italic' }}>No filings on record yet.</div>
            ) : (
              <div style={{ background: '#1B4332', border: '1px solid #2D6A4F', borderRadius: '10px', overflow: 'hidden' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 90px 120px 110px', borderBottom: '1px solid #2D6A4F', padding: '12px 20px' }}>
                  {['Insider', 'Title', 'Type', 'Value', 'Date'].map(h => (
                    <div key={h} style={{ fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#C9A84C', fontWeight: 600 }}>{h}</div>
                  ))}
                </div>
                {trades.map((trade, i) => {
                  const nm = (trade.insiders as any)?.name || 'Unknown'
                  const ttl = (trade.insiders as any)?.title || 'Director'
                  const lbl = txLabel(trade.transaction_type)
                  const buy = isBuy(trade.transaction_type)
                  return (
                    <div key={trade.id} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 90px 120px 110px', padding: '14px 20px', borderBottom: i < trades.length - 1 ? '1px solid #2D6A4F' : 'none', alignItems: 'center' }}>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: '#F7F4EF' }}>{nm}</div>
                      <div style={{ fontSize: '12px', color: '#DFC48B' }}>{ttl}</div>
                      <div>
                        <span style={{ background: buy ? '#1B4332' : '#2d1b1b', border: '1px solid ' + (buy ? '#C9A84C' : '#c94c4c'), borderRadius: '100px', padding: '3px 10px', fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', color: buy ? '#C9A84C' : '#c94c4c' }}>{lbl}</span>
                      </div>
                      <div style={{ fontFamily: 'monospace', fontSize: '13px', color: '#F7F4EF', fontWeight: 600 }}>{fmtVal(trade.shares, trade.price)}</div>
                      <div style={{ fontFamily: 'monospace', fontSize: '12px', color: '#DFC48B' }}>{fmtDate(trade.transaction_date)}</div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ background: '#1B4332', border: '1px solid #2D6A4F', borderRadius: '10px', padding: '24px' }}>
            <div style={{ fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#C9A84C', marginBottom: '16px', fontWeight: 600 }}>Data Sources</div>
            {[
              { icon: '📄', label: 'SEC Form 4', desc: 'Live insider trading disclosures', source: '*' },
              { icon: '🏛️', label: 'Congressional Disclosures', desc: 'Political trades and holdings', source: '**' },
              { icon: '📑', label: '13F Filings', desc: 'Quarterly institutional holdings', source: '*' },
            ].map(({ icon, label, desc, source }) => (
              <div key={label} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', padding: '10px 0', borderBottom: '1px solid #2D6A4F' }}>
                <span style={{ fontSize: '18px' }}>{icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#F7F4EF' }}>{label} <sup style={{ color: '#C9A84C', fontSize: '9px' }}>{source}</sup></div>
                  <div style={{ fontSize: '12px', color: '#DFC48B', marginTop: '2px' }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ background: '#1B4332', border: '1px solid #2D6A4F', borderRadius: '10px', padding: '24px' }}>
            <div style={{ fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#C9A84C', marginBottom: '16px', fontWeight: 600 }}>How the Score Works</div>
            <p style={{ fontSize: '13px', color: '#DFC48B', lineHeight: 1.7, marginBottom: '16px' }}>Each trade earns points across five categories. AI adjusts the score based on company quality, sector and historical patterns.</p>
            {[
              { factor: 'CEO purchase', pts: '+20' },
              { factor: 'CFO purchase', pts: '+18' },
              { factor: 'Multiple insiders buying', pts: '+25' },
              { factor: 'Purchase over $5M', pts: '+20' },
              { factor: 'No recent insider selling', pts: '+10' },
              { factor: 'Price down 30% before buy', pts: '+10' },
            ].map(({ factor, pts }) => (
              <div key={factor} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #07130E', fontSize: '12px' }}>
                <span style={{ color: '#DFC48B' }}>{factor}</span>
                <span style={{ fontFamily: 'monospace', color: '#C9A84C', fontWeight: 700 }}>{pts}</span>
              </div>
            ))}
          </div>

          <div style={{ background: '#07130E', border: '1px solid #1B4332', borderRadius: '8px', padding: '16px' }}>
            <div style={{ fontSize: '11px', color: '#2D6A4F', lineHeight: 1.6 }}>
              * SEC Form 4, sec.gov · ** House/Senate financial disclosures · All data publicly available · Not financial advice.
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
