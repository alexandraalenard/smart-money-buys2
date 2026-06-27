'use client'

import { useState } from 'react'
import Link from 'next/link'
import { supabase } from '../../lib/supabase'

interface Ranking {
  ticker: string
  score: number
  insider_conviction: number
  leadership_alignment: number
  historical_edge: number
  capital_commitment: number
  ai_opportunity: number
  ai_summary: string | null
  companies: { name: string; sector: string } | null
}

const POPULAR = ['AAPL', 'MSFT', 'NVDA', 'GOOGL', 'META', 'AMZN', 'TSLA', 'AMD']

const COMPONENTS: { key: keyof Ranking; label: string }[] = [
  { key: 'insider_conviction', label: 'Insider Conviction' },
  { key: 'leadership_alignment', label: 'Leadership Alignment' },
  { key: 'historical_edge', label: 'Historical Edge' },
  { key: 'capital_commitment', label: 'Capital Commitment' },
  { key: 'ai_opportunity', label: 'AI Opportunity Rating' },
]

const NAV = [
  { label: 'Signals', href: '/' },
  { label: 'Sell Alerts', href: '/sell-alerts' },
  { label: 'Congress', href: '/congress' },
  { label: 'Institutions', href: '/institutions' },
  { label: 'Subscribe', href: '/pricing' },
]

function scoreColor(s: number) {
  if (s >= 70) return '#C9A84C'
  if (s >= 50) return '#DFC48B'
  return '#7E8C83'
}

export default function StockScreener() {
  const [ticker, setTicker] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<Ranking | null>(null)
  const [notFound, setNotFound] = useState<string | null>(null)

  const search = async (rawTicker: string) => {
    const sym = (rawTicker || '').trim().toUpperCase()
    if (!sym) return
    setLoading(true)
    setResult(null)
    setNotFound(null)
    try {
      const { data, error } = await supabase
        .from('confidence_score_breakdowns')
        .select('*, companies (ticker, name, sector)')
        .eq('ticker', sym)
        .limit(1)
      if (error) throw error
      if (data && data.length) setResult(data[0] as unknown as Ranking)
      else setNotFound(sym)
    } catch (e) {
      setNotFound(sym)
    } finally {
      setLoading(false)
    }
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

      <section style={{ background: 'linear-gradient(180deg, #1B4332 0%, #07130E 100%)', padding: '56px 24px 40px', textAlign: 'center' }}>
        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '38px', margin: '0 0 12px', color: '#F7F4EF' }}>Stock Screener</h1>
        <p style={{ color: '#B9C4BC', maxWidth: '560px', margin: '0 auto', fontSize: '15px', lineHeight: 1.6 }}>
          Look up any company we track and see its real insider-signal score, built from SEC Form 4 filings. Every number here comes straight from our ranking engine — nothing is estimated.
        </p>
      </section>

      <main style={{ maxWidth: '760px', margin: '0 auto', padding: '32px 24px 80px' }}>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <input
            value={ticker}
            onChange={e => setTicker(e.target.value.toUpperCase())}
            onKeyDown={e => { if (e.key === 'Enter') search(ticker) }}
            placeholder="Enter a ticker (e.g. NVDA, AMD, REGN)"
            style={{ flex: '1 1 240px', padding: '14px 16px', borderRadius: '10px', border: '1px solid rgba(201,168,76,0.3)', background: '#0D1F16', color: '#F7F4EF', fontSize: '16px', fontFamily: 'monospace', letterSpacing: '0.08em' }}
          />
          <button onClick={() => search(ticker)} style={{ padding: '14px 26px', borderRadius: '10px', border: 'none', background: '#C9A84C', color: '#07130E', fontWeight: 700, fontSize: '15px', cursor: 'pointer' }}>Score it</button>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '14px' }}>
          {POPULAR.map(t => (
            <button key={t} onClick={() => { setTicker(t); search(t) }} style={{ padding: '6px 12px', borderRadius: '999px', border: '1px solid rgba(201,168,76,0.25)', background: 'transparent', color: '#B9C4BC', fontFamily: 'monospace', fontSize: '13px', cursor: 'pointer' }}>{t}</button>
          ))}
        </div>

        {loading && (<div style={{ marginTop: '40px', textAlign: 'center', color: '#B9C4BC' }}>Searching SEC filings…</div>)}

        {!loading && notFound && (
          <div style={{ marginTop: '40px', padding: '28px', borderRadius: '14px', border: '1px solid rgba(201,168,76,0.2)', background: '#0D1F16', textAlign: 'center' }}>
            <div style={{ fontFamily: 'monospace', fontSize: '20px', color: '#F7F4EF', marginBottom: '8px' }}>{notFound}</div>
            <div style={{ color: '#B9C4BC', fontSize: '14px', lineHeight: 1.6 }}>This ticker is not in our tracked companies yet. We score companies from real SEC Form 4 insider filings, and this one has not been imported. <Link href="/" style={{ color: '#C9A84C' }}>Browse the companies we track →</Link></div>
          </div>
        )}

        {!loading && result && (
          <div style={{ marginTop: '40px' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', borderBottom: '1px solid rgba(201,168,76,0.18)', paddingBottom: '16px' }}>
              <div>
                <div style={{ fontFamily: 'monospace', fontSize: '24px', color: '#F7F4EF' }}>{result.ticker}</div>
                <div style={{ color: '#B9C4BC', fontSize: '14px' }}>{result.companies?.name || ''}{result.companies?.sector ? ' · ' + result.companies.sector : ''}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: 'Georgia, serif', fontSize: '44px', fontWeight: 800, color: scoreColor(result.score), lineHeight: 1 }}>{result.score}<span style={{ fontSize: '18px', color: '#7E8C83' }}>/100</span></div>
                <div style={{ fontSize: '12px', color: '#7E8C83', letterSpacing: '0.1em', textTransform: 'uppercase' }}>AI Confidence Score</div>
              </div>
            </div>

            <div style={{ marginTop: '22px', display: 'grid', gap: '14px' }}>
              {COMPONENTS.map(comp => {
                const v = Number(result[comp.key] ?? 0)
                return (
                  <div key={comp.key as string}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '5px' }}>
                      <span style={{ color: '#DFC48B' }}>{comp.label}</span>
                      <span style={{ fontFamily: 'monospace', color: '#F7F4EF' }}>{v}/100</span>
                    </div>
                    <div style={{ height: '7px', borderRadius: '999px', background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
                      <div style={{ width: Math.max(0, Math.min(100, v)) + '%', height: '100%', background: scoreColor(v) }} />
                    </div>
                  </div>
                )
              })}
            </div>

            {result.ai_summary ? (
              <p style={{ marginTop: '22px', color: '#DFC48B', fontStyle: 'italic', fontSize: '14px', lineHeight: 1.6 }}>{result.ai_summary}</p>
            ) : (
              <p style={{ marginTop: '22px', color: '#8FA097', fontSize: '13px', lineHeight: 1.6 }}>This score reflects recent SEC Form 4 insider filing activity for this company.</p>
            )}

            <Link href={'/company/' + result.ticker} style={{ display: 'inline-block', marginTop: '20px', color: '#C9A84C', fontSize: '14px' }}>View full company page →</Link>
          </div>
        )}
      </main>

      <footer style={{ borderTop: '1px solid rgba(201,168,76,0.15)', padding: '24px', textAlign: 'center', color: '#5E6E64', fontSize: '12px' }}>
        Source: SEC EDGAR Form 4 filings. Scores generated by The Hidden Ledger ranking engine. Not financial advice.
      </footer>
    </div>
  )
}
