import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default async function SellAlertsPage() {
  const { data: sells } = await supabase
    .from('insider_transactions')
    .select('*, companies(ticker, name, sector), insiders(name, title)')
    .in('transaction_type', ['S', 'SELL', 's', 'sell'])
    .order('transaction_date', { ascending: false })
    .limit(100)

  const grouped: Record<string, any> = {}
  for (const trade of sells || []) {
    const ticker = (trade.companies as any)?.ticker
    if (!ticker) continue
    if (!grouped[ticker]) {
      grouped[ticker] = {
        ticker,
        name: (trade.companies as any)?.name || ticker,
        sector: (trade.companies as any)?.sector || '',
        trades: [],
        totalValue: 0,
        latestDate: trade.transaction_date
      }
    }
    grouped[ticker].trades.push(trade)
    grouped[ticker].totalValue += (trade.shares || 0) * (trade.price || 0)
  }

  const alerts = Object.values(grouped).sort((a: any, b: any) => b.totalValue - a.totalValue)

  function fmtCurrency(val: number) {
    if (!val) return '$0'
    if (val >= 1000000000) return '$' + (val/1000000000).toFixed(1) + 'B'
    if (val >= 1000000) return '$' + (val/1000000).toFixed(1) + 'M'
    if (val >= 1000) return '$' + (val/1000).toFixed(0) + 'K'
    return '$' + val.toLocaleString()
  }

  function fmtDate(d: string) {
    if (!d) return ''
    try { return new Date(d).toLocaleDateString('en-US', {month:'short',day:'numeric',year:'numeric'}) }
    catch { return d }
  }

  return (
    <main style={{background:'#07130E',minHeight:'100vh',color:'#F7F4EF',fontFamily:"'Inter', sans-serif"}}>
      <nav style={{background:'#1B4332',borderBottom:'1px solid #2D6A4F',padding:'0 48px',height:'64px',display:'flex',alignItems:'center',justifyContent:'space-between',position:'sticky',top:0,zIndex:100}}>
        <Link href="/" style={{textDecoration:'none',display:'flex',alignItems:'center',gap:'10px'}}>
          <div style={{width:'32px',height:'32px',background:'#2D6A4F',border:'1px solid #C9A84C',borderRadius:'6px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'16px'}}>📒</div>
          <div>
            <span style={{fontWeight:700,fontSize:'14px',letterSpacing:'0.08em',textTransform:'uppercase',color:'#F7F4EF'}}>THE </span>
            <span style={{fontStyle:'italic',fontSize:'14px',color:'#C9A84C'}}>HIDDEN </span>
            <span style={{fontWeight:700,fontSize:'14px',letterSpacing:'0.08em',textTransform:'uppercase',color:'#F7F4EF'}}>LEDGER</span>
          </div>
        </Link>
        <div style={{display:'flex',gap:'32px',alignItems:'center'}}>
          <Link href="/" style={{fontSize:'13px',color:'#DFC48B',letterSpacing:'0.06em',textTransform:'uppercase',textDecoration:'none'}}>Signals</Link>
          <Link href="/sell-alerts" style={{fontSize:'13px',color:'#C9A84C',letterSpacing:'0.06em',textTransform:'uppercase',textDecoration:'none',fontWeight:700}}>Sell Alerts</Link>
          <Link href="/congress" style={{fontSize:'13px',color:'#DFC48B',letterSpacing:'0.06em',textTransform:'uppercase',textDecoration:'none',opacity:0.5}}>Congress</Link>
          <Link href="/institutions" style={{fontSize:'13px',color:'#DFC48B',letterSpacing:'0.06em',textTransform:'uppercase',textDecoration:'none',opacity:0.5}}>Institutions</Link>
          <Link href="/pricing" style={{background:'#C9A84C',color:'#07130E',padding:'8px 20px',borderRadius:'6px',fontSize:'12px',fontWeight:700,letterSpacing:'0.08em',textTransform:'uppercase',textDecoration:'none'}}>Subscribe</Link>
        </div>
      </nav>

      <section style={{background:'linear-gradient(180deg, #1B4332 0%, #07130E 100%)',padding:'64px 48px 48px',borderBottom:'1px solid #2D6A4F',textAlign:'center'}}>
        <div style={{display:'inline-block',background:'rgba(220,38,38,0.15)',border:'1px solid rgba(220,38,38,0.4)',borderRadius:'100px',padding:'4px 16px',marginBottom:'20px',fontSize:'11px',letterSpacing:'0.12em',textTransform:'uppercase',color:'#F87171',fontWeight:600}}>
          INSIDER SELL ALERTS
        </div>
        <h1 style={{fontFamily:'Georgia, serif',fontSize:'48px',fontWeight:700,color:'#F7F4EF',marginBottom:'16px',lineHeight:1.1}}>
          When insiders <span style={{fontStyle:'italic',color:'#F87171'}}>dump</span>, you should know.
        </h1>
        <p style={{color:'#DFC48B',fontSize:'16px',maxWidth:'560px',margin:'0 auto',lineHeight:1.7}}>
          SEC Form 4 sell disclosures tracked in real time. Large insider exits can signal trouble ahead.
        </p>
      </section>

      <section style={{maxWidth:'1280px',margin:'0 auto',padding:'56px 48px'}}>
        {alerts.length === 0 ? (
          <div style={{textAlign:'center',padding:'80px',color:'#2D6A4F',fontStyle:'italic',fontSize:'18px',fontFamily:'Georgia, serif'}}>
            No insider sell alerts detected yet.
          </div>
        ) : (
          <div style={{display:'flex',flexDirection:'column',gap:'16px'}}>
            {alerts.map((alert: any) => (
              <Link href={'/company/' + alert.ticker} key={alert.ticker} style={{textDecoration:'none'}}>
                <div style={{background:'#1B4332',border:'1px solid #2D6A4F',borderRadius:'10px',padding:'24px 28px',display:'grid',gridTemplateColumns:'1fr auto',gap:'24px',alignItems:'center',cursor:'pointer'}}>
                  <div>
                    <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'8px'}}>
                      <span style={{fontFamily:'monospace',fontSize:'20px',fontWeight:700,color:'#F7F4EF'}}>{alert.ticker}</span>
                      <span style={{fontSize:'15px',color:'#DFC48B'}}>{alert.name}</span>
                      {alert.sector && <span style={{background:'#2D6A4F',border:'1px solid #C9A84C',borderRadius:'100px',padding:'2px 10px',fontSize:'10px',color:'#C9A84C',letterSpacing:'0.08em',textTransform:'uppercase'}}>{alert.sector}</span>}
                    </div>
                    <div style={{display:'flex',flexDirection:'column',gap:'4px'}}>
                      {alert.trades.slice(0,3).map((t: any, i: number) => (
                        <div key={i} style={{fontSize:'12px',color:'#DFC48B'}}>
                          <span style={{color:'#F87171',fontWeight:600}}>{(t.insiders as any)?.name||'Unknown'}</span>
                          {' · '}{(t.insiders as any)?.title||'Director'}
                          {' · '}<span style={{fontFamily:'monospace',color:'#F7F4EF'}}>{fmtCurrency((t.shares||0)*(t.price||0))}</span>
                          {' · '}{fmtDate(t.transaction_date)}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div style={{textAlign:'right'}}>
                    <div style={{fontSize:'11px',letterSpacing:'0.1em',textTransform:'uppercase',color:'#F87171',marginBottom:'4px'}}>Total Sold</div>
                    <div style={{fontFamily:'monospace',fontSize:'28px',fontWeight:700,color:'#F87171'}}>{fmtCurrency(alert.totalValue)}</div>
                    <div style={{fontSize:'12px',color:'#DFC48B',marginTop:'4px'}}>{alert.trades.length} filing{alert.trades.length!==1?'s':''}</div>
                    <div style={{fontSize:'11px',color:'#2D6A4F',marginTop:'8px'}}>View company →</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <footer style={{padding:'40px 48px',borderTop:'1px solid #1B4332'}}>
        <div style={{maxWidth:'1280px',margin:'0 auto',fontSize:'11px',color:'#2D6A4F',lineHeight:1.6}}>
          * Source: SEC Form 4 — public insider trading disclosures. All data is publicly available. Not financial advice.
        </div>
      </footer>
    </main>
  )
}
