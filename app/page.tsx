'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Company {
  id: string
  ticker: string
  name: string
  sector: string
  ai_confidence_score: number
  rank: number
}

export default function HomePage() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    fetchRankings()
  }, [])

  async function fetchRankings() {
    try {
      const res = await fetch('/api/rankings')
      const data = await res.json()
      if (data.rankings) {
        setCompanies(data.rankings.slice(0, 10))
      }
    } catch (err) {
      console.error('Failed to fetch rankings:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return
    // TODO: wire up to email service
    setSubmitted(true)
    setEmail('')
  }

  return (
    <div style={{ background: '#07130E', minHeight: '100vh', color: '#E8E0D0', fontFamily: 'Georgia, serif' }}>

      {/* NAV */}
      <nav style={{
        borderBottom: '1px solid #1B4332',
        padding: '0 40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '64px',
        position: 'sticky',
        top: 0,
        background: '#07130E',
        zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '20px' }}>📒</span>
          <span style={{ color: '#C9A84C', fontWeight: 700, fontSize: '16px', letterSpacing: '0.08em' }}>
            THE HIDDEN LEDGER
          </span>
        </div>
        <div style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
          <Link href="/" style={{ color: '#E8E0D0', textDecoration: 'none', fontSize: '13px', letterSpacing: '0.1em', fontFamily: 'monospace' }}>
            SIGNALS
          </Link>
          <Link href="/sell-alerts" style={{ color: '#C9A84C', textDecoration: 'none', fontSize: '13px', letterSpacing: '0.1em', fontFamily: 'monospace' }}>
            SELL ALERTS
          </Link>
          <Link href="/congress" style={{ color: '#E8E0D0', textDecoration: 'none', fontSize: '13px', letterSpacing: '0.1em', fontFamily: 'monospace', opacity: 0.5 }}>
            CONGRESS
          </Link>
          <Link href="/institutions" style={{ color: '#E8E0D0', textDecoration: 'none', fontSize: '13px', letterSpacing: '0.1em', fontFamily: 'monospace', opacity: 0.5 }}>
            INSTITUTIONS
          </Link>
          <Link href="#subscribe" style={{
            background: '#C9A84C',
            color: '#07130E',
            padding: '8px 20px',
            fontSize: '12px',
            letterSpacing: '0.1em',
            fontFamily: 'monospace',
            fontWeight: 700,
            textDecoration: 'none',
          }}>
            SUBSCRIBE
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ padding: '100px 40px 80px', maxWidth: '900px', margin: '0 auto' }}>
        <p style={{ color: '#C9A84C', fontSize: '12px', letterSpacing: '0.2em', fontFamily: 'monospace', marginBottom: '24px' }}>
          Follow the money. Find the signal.
        </p>
        <h1 style={{ fontSize: '56px', fontWeight: 400, lineHeight: 1.1, marginBottom: '16px', color: '#E8E0D0' }}>
          The information
        </h1>
        <h1 style={{ fontSize: '56px', fontWeight: 400, lineHeight: 1.1, marginBottom: '40px', color: '#C9A84C' }}>
          they acted on.
        </h1>
        <p style={{ fontSize: '18px', color: '#9A9080', lineHeight: 1.7, maxWidth: '600px', marginBottom: '48px' }}>
          Smart Money Buys tracks SEC Form 4 filings, congressional disclosures and institutional 13F filings — then ranks every signal by AI confidence score.
        </p>
        <div style={{ display: 'flex', gap: '16px' }}>
          <a href="#signals" style={{
            background: '#C9A84C',
            color: '#07130E',
            padding: '14px 32px',
            fontSize: '13px',
            letterSpacing: '0.1em',
            fontFamily: 'monospace',
            fontWeight: 700,
            textDecoration: 'none',
          }}>
            VIEW TODAY&apos;S SIGNALS
          </a>
          <a href="#how-it-works" style={{
            border: '1px solid #1B4332',
            color: '#E8E0D0',
            padding: '14px 32px',
            fontSize: '13px',
            letterSpacing: '0.1em',
            fontFamily: 'monospace',
            textDecoration: 'none',
          }}>
            HOW IT WORKS
          </a>
        </div>
      </section>

      {/* SAMPLE SIGNAL CARD */}
      <section style={{ padding: '0 40px 80px', maxWidth: '900px', margin: '0 auto' }}>
        <p style={{ color: '#C9A84C', fontSize: '11px', letterSpacing: '0.15em', fontFamily: 'monospace', marginBottom: '16px' }}>
          LATEST SIGNAL
        </p>
        <div style={{
          border: '1px solid #1B4332',
          padding: '28px 32px',
          display: 'grid',
          gridTemplateColumns: 'auto 1fr auto',
          gap: '24px',
          alignItems: 'center',
          maxWidth: '640px',
        }}>
          <div>
            <div style={{ color: '#C9A84C', fontFamily: 'monospace', fontSize: '14px', letterSpacing: '0.1em' }}>NVDA · BUY</div>
            <div style={{ color: '#9A9080', fontSize: '13px', marginTop: '4px' }}>Nancy Pelosi · House · CA-11</div>
          </div>
          <div style={{ display: 'flex', gap: '32px' }}>
            <div>
              <div style={{ color: '#9A9080', fontSize: '11px', fontFamily: 'monospace', letterSpacing: '0.1em' }}>AI SCORE</div>
              <div style={{ color: '#E8E0D0', fontSize: '24px', fontFamily: 'monospace' }}>91 <span style={{ fontSize: '13px', color: '#9A9080' }}>/ 100</span></div>
            </div>
            <div>
              <div style={{ color: '#9A9080', fontSize: '11px', fontFamily: 'monospace', letterSpacing: '0.1em' }}>VALUE</div>
              <div style={{ color: '#E8E0D0', fontSize: '14px', marginTop: '4px' }}>$500K–$1M</div>
            </div>
            <div>
              <div style={{ color: '#9A9080', fontSize: '11px', fontFamily: 'monospace', letterSpacing: '0.1em' }}>FILED</div>
              <div style={{ color: '#E8E0D0', fontSize: '14px', marginTop: '4px' }}>2024-01-17</div>
            </div>
            <div>
              <div style={{ color: '#9A9080', fontSize: '11px', fontFamily: 'monospace', letterSpacing: '0.1em' }}>GAIN SINCE</div>
              <div style={{ color: '#4CAF50', fontSize: '14px', marginTop: '4px' }}>+31.4%</div>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ color: '#9A9080', fontSize: '11px', fontFamily: 'monospace' }}>Source: SEC Form 4 · Public Disclosure*</div>
            <div style={{ color: '#C9A84C', fontSize: '12px', fontFamily: 'monospace', marginTop: '4px' }}>View full filing →</div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section style={{ padding: '40px', borderTop: '1px solid #1B4332', borderBottom: '1px solid #1B4332', marginBottom: '80px' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '32px', textAlign: 'center' }}>
          {[
            { value: '2,847', label: 'Trades Tracked' },
            { value: '$4.2B', label: 'Value Monitored' },
            { value: '94%', label: 'Filing Coverage' },
            { value: '+22.4%', label: 'Avg Return Following Signal' },
          ].map(stat => (
            <div key={stat.label}>
              <div style={{ color: '#C9A84C', fontSize: '32px', fontFamily: 'monospace', fontWeight: 700 }}>{stat.value}</div>
              <div style={{ color: '#9A9080', fontSize: '12px', letterSpacing: '0.1em', marginTop: '8px' }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* TOP 10 SIGNALS */}
      <section id="signals" style={{ padding: '0 40px 80px', maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
          <h2 style={{ fontSize: '28px', fontWeight: 400, color: '#E8E0D0' }}>Today&apos;s Top Signals</h2>
          <span style={{ color: '#9A9080', fontSize: '12px', fontFamily: 'monospace' }}>AI-Ranked · Updated Daily</span>
        </div>
        <p style={{ color: '#9A9080', fontSize: '13px', marginBottom: '32px' }}>Ranked by AI Confidence Score</p>

        {loading ? (
          <div style={{ color: '#9A9080', fontFamily: 'monospace', fontSize: '13px' }}>Scanning SEC filings...</div>
        ) : companies.length === 0 ? (
          <div style={{ color: '#9A9080', fontFamily: 'monospace', fontSize: '13px' }}>No rankings available.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {companies.map((company, i) => (
              <Link
                key={company.id}
                href={`/company/${company.ticker}`}
                style={{ textDecoration: 'none' }}
              >
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '40px 60px 1fr 100px 100px',
                  alignItems: 'center',
                  padding: '16px 20px',
                  border: '1px solid #1B4332',
                  marginBottom: '2px',
                  cursor: 'pointer',
                  transition: 'background 0.15s',
                  background: i === 0 ? 'rgba(201,168,76,0.05)' : 'transparent',
                }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(27,67,50,0.4)')}
                  onMouseLeave={e => (e.currentTarget.style.background = i === 0 ? 'rgba(201,168,76,0.05)' : 'transparent')}
                >
                  <span style={{ color: '#9A9080', fontFamily: 'monospace', fontSize: '13px' }}>#{i + 1}</span>
                  <span style={{ color: '#C9A84C', fontFamily: 'monospace', fontSize: '14px', fontWeight: 700 }}>{company.ticker}</span>
                  <span style={{ color: '#E8E0D0', fontSize: '14px' }}>{company.name}</span>
                  <span style={{ color: '#9A9080', fontSize: '12px' }}>{company.sector}</span>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{
                      background: company.ai_confidence_score >= 80 ? '#1B4332' : '#2A1A00',
                      color: company.ai_confidence_score >= 80 ? '#4CAF50' : '#C9A84C',
                      padding: '4px 10px',
                      fontSize: '13px',
                      fontFamily: 'monospace',
                    }}>
                      {company.ai_confidence_score ?? '—'}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* EMAIL SIGNUP */}
      <section id="subscribe" style={{
        background: '#0D2218',
        border: '1px solid #1B4332',
        padding: '60px 40px',
        maxWidth: '900px',
        margin: '0 auto 80px',
        textAlign: 'center',
      }}>
        <p style={{ color: '#C9A84C', fontSize: '11px', letterSpacing: '0.2em', fontFamily: 'monospace', marginBottom: '16px' }}>
          THE WEEKLY LEDGER
        </p>
        <h2 style={{ fontSize: '28px', fontWeight: 400, marginBottom: '12px', color: '#E8E0D0' }}>
          5 filings worth watching<br />before Monday.
        </h2>
        <p style={{ color: '#9A9080', fontSize: '14px', lineHeight: 1.7, maxWidth: '480px', margin: '0 auto 32px' }}>
          Every weekend we send the top-ranked insider signals direct to your inbox. No noise. Just the trades worth watching.
        </p>
        {submitted ? (
          <p style={{ color: '#4CAF50', fontFamily: 'monospace', fontSize: '14px' }}>✓ You&apos;re on the list.</p>
        ) : (
          <form onSubmit={handleEmailSubmit} style={{ display: 'flex', gap: '0', maxWidth: '400px', margin: '0 auto' }}>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
              style={{
                flex: 1,
                background: '#07130E',
                border: '1px solid #1B4332',
                borderRight: 'none',
                padding: '12px 16px',
                color: '#E8E0D0',
                fontSize: '14px',
                fontFamily: 'Georgia, serif',
                outline: 'none',
              }}
            />
            <button type="submit" style={{
              background: '#C9A84C',
              color: '#07130E',
              border: 'none',
              padding: '12px 24px',
              fontSize: '12px',
              letterSpacing: '0.1em',
              fontFamily: 'monospace',
              fontWeight: 700,
              cursor: 'pointer',
            }}>
              GET SIGNALS
            </button>
          </form>
        )}
      </section>

      {/* FOOTER */}
      <footer style={{
        borderTop: '1px solid #1B4332',
        padding: '32px 40px',
        maxWidth: '900px',
        margin: '0 auto',
      }}>
        <p style={{ color: '#9A9080', fontSize: '11px', lineHeight: 1.8 }}>
          © 2026 Smart Money Buys · All rights reserved
        </p>
        <p style={{ color: '#4A4A4A', fontSize: '10px', lineHeight: 1.7, marginTop: '12px', maxWidth: '700px' }}>
          * Source: SEC Form 4 — public insider trading disclosures filed with the U.S. Securities and Exchange Commission ·{' '}
          ** Source: House/Senate financial disclosure filings, Office of the Clerk · All data is publicly available. Not financial advice.
        </p>
      </footer>

    </div>
  )
}