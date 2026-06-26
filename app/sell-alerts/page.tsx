import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default async function SellAlertsPage() {
  const { data: sells } = await supabase
    .from('trades')
    .select('*, companies(ticker, name, sector)')
    .eq('transaction_type', 'SELL')
    .order('transaction_date', { ascending: false })
    .limit(50)

  const grouped: Record<string, any> = {}
  for (const trade of sells || []) {
    const ticker = trade.companies?.ticker
    if (!ticker) continue
    if (!grouped[ticker]) {
      grouped[ticker] = {
        ticker,
        name: trade.companies?.name,
        sector: trade.companies?.sector,
        trades: [],
        totalValue: 0,
        latestDate: trade.transaction_date
      }
    }
    grouped[ticker].trades.push(trade)
    grouped[ticker].totalValue += trade.total_value || 0
  }

  const alerts = Object.values(grouped).sort((a: any, b: any) => b.totalValue - a.totalValue)

  return (
    <div style={{ background: '#07130E', minHeight: '100vh', color: '#E8E0D0', fontFamily: 'Georgia, serif' }}>
      {/* Nav */}
      <nav style={{ background: '#07130E', borderBottom: '1px solid #1B4332', padding: '0 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '64px' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
          <div style={{ width: 32, height: 32, background: '#C9A84C', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>📒</div>
          <span style={{ color: '#E8E0D0', fontWeight: 700, fontSize: '1.1rem', letterSpacing: 2 }}>THE <span style={{ color: '#C9A84C' }}>HIDDEN</span> LEDGER</span>
        </Link>
        <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
          <Link href="/" style={{ color: '#9CA3AF', textDecoration: 'none', fontSize: '0.85rem', letterSpacing: 1 }}>SIGNALS</Link>
          <Link href="/sell-alerts" style={{ color: '#C9A84C', textDecoration: 'none', fontSize: '0.85rem', letterSpacing: 1 }}>SELL ALERTS</Link>
          <Link href="/" style={{ background: '#C9A84C', color: '#07130E', padding: '0.4rem 1rem', borderRadius: 4, textDecoration: 'none', fontSize: '0.85rem', fontWeight: 700, letterSpacing: 1 }}>SUBSCRIBE</Link>
        </div>
      </nav>

      {/* Header */}
      <div style={{ background: 'linear-gradient(180deg, #1B4332 0%, #07130E 100%)', padding: '3rem 2rem 2rem', textAlign: 'center', borderBottom: '1px solid #1B4332' }}>
        <div style={{ display: 'inline-block', background: 'rgba(220,38,38,0.15)', border: '1px solid rgba(220,38,38,0.4)', borderRadius: 4, padding: '0.3rem 0.8rem', marginBottom: '1rem', fontSize: '0.75rem', letterSpacing: 2, color: '#F87171' }}>
          ⚠ INSIDER SELL ALERTS
        </div>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 700, color: '#E8E0D0', margin: '0 0 0.5rem' }}>
          Insider Sell Alerts
        </h1>
        <p style={{ color: '#9CA3AF', maxWidth: 600, margin: '0 auto', lineHeight: 1.6 }}>
          Real-time tracking of insider stock sales filed with the SEC. Large sells by executives can signal reduced confidence in company prospects.
        </p>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '2rem' }}>
        {alerts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#9CA3AF' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
            <p>No sell alerts yet. The pipeline is collecting real SEC data — check back soon.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {alerts.map((alert: any, i: number) => (
              <Link key={alert.ticker} href={`/company/${alert.ticker}`} style={{ textDecoration: 'none' }}>
                <div style={{ background: '#0D1F17', border: '1px solid rgba(220,38,38,0.3)', borderLeft: '4px solid #DC2626', borderRadius: 8, padding: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', transition: 'border-color 0.2s' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#DC2626', width: 40 }}>#{i + 1}</div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                        <span style={{ fontSize: '1.2rem', fontWeight: 700, color: '#E8E0D0' }}>{alert.ticker}</span>
                        <span style={{ color: '#9CA3AF', fontSize: '0.95rem' }}>{alert.name}</span>
                        {alert.sector && (
                          <span style={{ background: 'rgba(220,38,38,0.15)', border: '1px solid rgba(220,38,38,0.3)', borderRadius: 4, padding: '0.15rem 0.5rem', fontSize: '0.7rem', color: '#F87171', letterSpacing: 1 }}>{alert.sector}</span>
                        )}
                      </div>
                      <div style={{ color: '#9CA3AF', fontSize: '0.85rem' }}>
                        {alert.trades.length} insider sell{alert.trades.length > 1 ? 's' : ''} · Latest: {new Date(alert.latestDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                        {alert.trades.slice(0, 3).map((t: any, j: number) => (
                          <span key={j} style={{ background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 4, padding: '0.15rem 0.5rem', fontSize: '0.7rem', color: '#F87171' }}>
                            {t.insider_name} · ${(t.total_value / 1000000).toFixed(1)}M
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#DC2626' }}>
                      ${(alert.totalValue / 1000000).toFixed(1)}M
                    </div>
                    <div style={{ color: '#9CA3AF', fontSize: '0.75rem', letterSpacing: 1 }}>TOTAL SOLD</div>
                    <div style={{ color: '#F87171', fontSize: '0.75rem', marginTop: '0.25rem' }}>⚠ SELL ALERT →</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        <div style={{ marginTop: '2rem', padding: '1rem', background: '#0D1F17', borderRadius: 8, border: '1px solid #1B4332', fontSize: '0.75rem', color: '#6B7280', lineHeight: 1.6 }}>
          * Source: SEC Form 4 — public insider trading disclosures filed with the U.S. Securities and Exchange Commission (sec.gov). Insider selling does not necessarily indicate negative outlook. All information is publicly available. This is not financial advice.
        </div>
      </div>
    </div>
  )
}