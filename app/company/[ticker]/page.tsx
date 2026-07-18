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

interface EvidenceData {
  evidence_density: string
  news: {
    article_count: number
    distinct_outlets: number
    latest_published_at: string | null
    articles: { headline: string; source: string | null; url: string | null; published_at: string | null; summary: string | null }[]
  }
  insider: {
    form4_count: number
    distinct_insiders: number
    purchase_count: number
    sale_count: number
    award_count: number
    exercise_count: number
    purchase_value: number
    sale_value: number
  }
}

interface Argument { point: string; source: string }
interface BullBear {
  available: boolean
  reason?: string
  bull: Argument[]
  bear: Argument[]
  evidence_note?: string | null
}

export default function CompanyPage() {
  const params = useParams()
  const ticker = (params?.ticker as string)?.toUpperCase()
  const [company, setCompany] = useState<Company | null>(null)
  const [ranking, setRanking] = useState<Ranking | null>(null)
  const [trades, setTrades] = useState<Trade[]>([])
  const [loading, setLoading] = useState(true)
  const [evidence, setEvidence] = useState<EvidenceData | null>(null)
  const [bullbear, setBullbear] = useState<BullBear | null>(null)
  const [bbLoading, setBbLoading] = useState(true)

  useEffect(() => {
    if (ticker) fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        .from('insider_transactions')
        .select('*, insiders(name, title)')
        .eq('company_id', companyData.id)
        .order('transaction_date', { ascending: false })
        .limit(20)
      if (tradesData) setTrades(tradesData)

      // Evidence panel (server route — counts real records)
      fetch(`/api/evidence?ticker=${ticker}`)
        .then((r) => r.json())
        .then((d) => { if (d && !d.error) setEvidence(d) })
        .catch(() => {})

      // Bull / Bear (server route — AI, grounded in this stock's sources)
      fetch(`/api/bull-bear?ticker=${ticker}`)
        .then((r) => r.json())
        .then((d) => setBullbear(d))
        .catch(() => setBullbear({ available: false, reason: 'Could not reach analysis service', bull: [], bear: [] }))
        .finally(() => setBbLoading(false))
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

  function usd(v: number) {
    if (!v) return '$0'
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

  function fmtDate(d: string | null) {
    if (!d) return 'N/A'
    try { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) }
    catch { return d }
  }

  function densityColor(dsty: string) {
    if (dsty === 'Substantial') return '#C9A84C'
    if (dsty === 'Moderate') return '#DFC48B'
    if (dsty === 'Thin') return '#8fae9c'
    return '#2D6A4F'
  }

  const scoreComponents = ranking ? [
    { label: 'Insider Conviction', desc: 'How significant were the purchases?', val: ranking.insider_conviction },
    { label: 'Leadership Alignment', desc: 'Did multiple senior executives buy?', val: ranking.leadership_alignment },
    { label: 'Historical Edge', desc: 'How often has this pattern worked?', val: ranking.historical_edge },
    { label: 'Capital Commitment', desc: 'How much personal money is at stake?', val: ranking.capital_commitment },
    { label: 'AI Opportunity Rating', desc: 'Overall AI assessment', val: ranking.ai_opportunity },
  ] : []

  const aiReasons = (ranking?.ai_reasons && ranking.ai_reasons.length) ? ranking.ai_reasons : []

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
              {ranking.ai_summary ? (
                <p style={{ fontFamily: 'Georgia, serif', fontSize: '17px', lineHeight: 1.8, color: '#F7F4EF', fontStyle: 'italic', marginBottom: aiReasons.length ? '20px' : 0 }}>
                  {ranking.ai_summary}
                </p>
              ) : (
                <p style={{ fontSize: '14px', lineHeight: 1.7, color: '#DFC48B', marginBottom: aiReasons.length ? '20px' : 0 }}>
                  No written analysis is available for this company yet. The confidence score is computed from its SEC Form 4 insider filings — see the breakdown below.
                </p>
              )}
              {aiReasons.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {aiReasons.map((r, i) => (
                    <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                      <span style={{ color: '#C9A84C', fontWeight: 700, fontSize: '13px', marginTop: '1px' }}>+</span>
                      <span style={{ fontSize: '14px', color: '#DFC48B' }}>{r}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ============ EVIDENCE PANEL ============ */}
          {evidence && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#C9A84C', fontWeight: 600 }}>The Evidence</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '11px', color: '#DFC48B' }}>Evidence density:</span>
                  <span style={{ fontFamily: 'monospace', fontSize: '13px', fontWeight: 700, color: densityColor(evidence.evidence_density), border: '1px solid ' + densityColor(evidence.evidence_density), borderRadius: '100px', padding: '2px 12px' }}>{evidence.evidence_density}</span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
                {[
                  { label: 'Outlets covering', val: String(evidence.news.distinct_outlets), sub: `${evidence.news.article_count} articles` },
                  { label: 'Insider purchases', val: String(evidence.insider.purchase_count), sub: usd(evidence.insider.purchase_value), buy: true },
                  { label: 'Insider sales', val: String(evidence.insider.sale_count), sub: usd(evidence.insider.sale_value), sell: true },
                  { label: 'Awards / exercises', val: String(evidence.insider.award_count + evidence.insider.exercise_count), sub: 'not purchases' },
                ].map((t: any) => (
                  <div key={t.label} style={{ background: '#1B4332', border: '1px solid #2D6A4F', borderRadius: '8px', padding: '14px 16px' }}>
                    <div style={{ fontSize: '10px', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#C9A84C', marginBottom: '6px' }}>{t.label}</div>
                    <div style={{ fontFamily: 'monospace', fontSize: '24px', fontWeight: 800, color: t.buy ? '#C9A84C' : t.sell ? '#c98a4c' : '#F7F4EF', lineHeight: 1 }}>{t.val}</div>
                    <div style={{ fontSize: '11px', color: '#DFC48B', marginTop: '4px' }}>{t.sub}</div>
                  </div>
                ))}
              </div>

              <p style={{ fontSize: '12px', color: '#2D6A4F', lineHeight: 1.6, marginBottom: '20px', fontStyle: 'italic' }}>
                &ldquo;Evidence density&rdquo; describes how much documented material exists right now — it is not a rating of the stock or a prediction. Many outlets covering one story is broad coverage, not independent confirmation. Awards and option exercises are compensation, not insiders buying with their own money.
              </p>

              {evidence.news.articles.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {evidence.news.articles.slice(0, 8).map((a, i) => (
                    <div key={i} style={{ background: '#1B4332', border: '1px solid #2D6A4F', borderRadius: '8px', padding: '14px 18px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', marginBottom: '4px' }}>
                        <span style={{ fontSize: '11px', color: '#DFC48B' }}>{a.source || 'Unknown source'}</span>
                        <span style={{ fontSize: '11px', color: '#2D6A4F', whiteSpace: 'nowrap' }}>{fmtDate(a.published_at)}</span>
                      </div>
                      {a.url ? (
                        <a href={a.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                          <div style={{ fontFamily: 'Georgia, serif', fontSize: '15px', color: '#F7F4EF', lineHeight: 1.4 }}>{a.headline}</div>
                        </a>
                      ) : (
                        <div style={{ fontFamily: 'Georgia, serif', fontSize: '15px', color: '#F7F4EF', lineHeight: 1.4 }}>{a.headline}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ============ BULL / BEAR ============ */}
          <div>
            <div style={{ fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#C9A84C', marginBottom: '8px', fontWeight: 600 }}>Bull case vs Bear case</div>
            <p style={{ fontSize: '12px', color: '#2D6A4F', lineHeight: 1.6, marginBottom: '16px', fontStyle: 'italic' }}>
              Arguments drawn only from the news and filings above — each tied to its source. These are the cases people could make, not predictions and not advice.
            </p>

            {bbLoading && (
              <div style={{ background: '#1B4332', border: '1px solid #2D6A4F', borderRadius: '10px', padding: '32px', textAlign: 'center', color: '#DFC48B', fontStyle: 'italic', fontFamily: 'Georgia, serif' }}>Weighing the arguments…</div>
            )}

            {!bbLoading && bullbear && bullbear.available === false && (
              <div style={{ background: '#1B4332', border: '1px solid #2D6A4F', borderRadius: '10px', padding: '24px', color: '#DFC48B', fontSize: '14px', lineHeight: 1.6 }}>
                The bull/bear analysis isn&apos;t available right now{bullbear.reason ? ` (${bullbear.reason})` : ''}. Nothing is being made up in its place.
              </div>
            )}

            {!bbLoading && bullbear && bullbear.available !== false && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div style={{ background: '#12241b', border: '1px solid #2D6A4F', borderRadius: '10px', padding: '20px' }}>
                    <div style={{ fontSize: '12px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#C9A84C', fontWeight: 700, marginBottom: '14px' }}>▲ Bull case</div>
                    {bullbear.bull && bullbear.bull.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        {bullbear.bull.map((a, i) => (
                          <div key={i}>
                            <div style={{ fontSize: '14px', color: '#F7F4EF', lineHeight: 1.5 }}>{a.point}</div>
                            {a.source && <div style={{ fontSize: '11px', color: '#8fae9c', marginTop: '4px', fontStyle: 'italic' }}>Source: {a.source}</div>}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ fontSize: '13px', color: '#DFC48B', fontStyle: 'italic' }}>The sources don&apos;t support a bull case right now.</div>
                    )}
                  </div>

                  <div style={{ background: '#241515', border: '1px solid #5c3030', borderRadius: '10px', padding: '20px' }}>
                    <div style={{ fontSize: '12px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#e08a8a', fontWeight: 700, marginBottom: '14px' }}>▼ Bear case</div>
                    {bullbear.bear && bullbear.bear.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        {bullbear.bear.map((a, i) => (
                          <div key={i}>
                            <div style={{ fontSize: '14px', color: '#F7F4EF', lineHeight: 1.5 }}>{a.point}</div>
                            {a.source && <div style={{ fontSize: '11px', color: '#c98f8f', marginTop: '4px', fontStyle: 'italic' }}>Source: {a.source}</div>}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ fontSize: '13px', color: '#DFC48B', fontStyle: 'italic' }}>The sources don&apos;t support a bear case right now.</div>
                    )}
                  </div>
                </div>
                {bullbear.evidence_note && (
                  <p style={{ fontSize: '12px', color: '#2D6A4F', lineHeight: 1.6, marginTop: '14px' }}>{bullbear.evidence_note}</p>
                )}
              </>
            )}
          </div>

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
              { icon: '📰', label: 'Finnhub company news', desc: 'Recent headlines per ticker', source: '***' },
              { icon: '🏛️', label: 'Congressional Disclosures', desc: 'Political trades and holdings', source: '**' },
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
              * SEC Form 4, sec.gov · ** House/Senate financial disclosures · *** Finnhub company news · All data publicly available · Not financial advice.
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
