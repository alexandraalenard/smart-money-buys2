import Link from 'next/link'

// Unusual activity data - in production this would be calculated from real-time trade volume vs 30-day average
// Volume Surge = today's volume / 30-day avg volume (e.g. 3.2 = 320% of normal)
const VOLUME_EXPLOSIONS: any[] = []

function getSurgeColor(type: string, surge: number) {
  if (type === 'BUY_SURGE') return surge > 4 ? '#C9A84C' : surge > 2.5 ? '#DFC48B' : '#2D6A4F'
  return surge > 4 ? '#c94c4c' : surge > 2.5 ? '#F87171' : '#ef4444'
}

function getSurgeBg(type: string) {
  return type === 'BUY_SURGE' ? '#1B4332' : '#2d1b1b'
}

function getSurgeBorder(type: string) {
  return type === 'BUY_SURGE' ? '#2D6A4F' : 'rgba(220,38,38,0.3)'
}

const buys = VOLUME_EXPLOSIONS.filter(v => v.type === 'BUY_SURGE').sort((a,b) => b.surge - a.surge)
const sells = VOLUME_EXPLOSIONS.filter(v => v.type === 'SELL_OFF').sort((a,b) => b.surge - a.surge)

export default function BuyersCornerPage() {
  return (
    <main style={{background:'#07130E',minHeight:'100vh',fontFamily:"'Inter', sans-serif",color:'#F7F4EF'}}>
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
          <Link href="/stock-screener" style={{fontSize:'13px',color:'#DFC48B',letterSpacing:'0.06em',textTransform:'uppercase',textDecoration:'none'}}>Screener</Link>
          <Link href="/buyers-corner" style={{fontSize:'13px',color:'#C9A84C',letterSpacing:'0.06em',textTransform:'uppercase',textDecoration:'none',fontWeight:700}}>Buyers Corner</Link>
          <Link href="/billionaires-corner" style={{fontSize:'13px',color:'#DFC48B',letterSpacing:'0.06em',textTransform:'uppercase',textDecoration:'none'}}>Billionaires</Link>
          <Link href="/pricing" style={{background:'#C9A84C',color:'#07130E',padding:'8px 20px',borderRadius:'6px',fontSize:'12px',fontWeight:700,letterSpacing:'0.08em',textTransform:'uppercase',textDecoration:'none'}}>Subscribe</Link>
        </div>
      </nav>

      <section style={{background:'linear-gradient(180deg, #1B4332 0%, #07130E 100%)',padding:'64px 48px 48px',borderBottom:'1px solid #2D6A4F',textAlign:'center'}}>
        <div style={{display:'inline-block',background:'#2D6A4F',border:'1px solid #C9A84C',borderRadius:'100px',padding:'4px 16px',marginBottom:'20px',fontSize:'11px',letterSpacing:'0.12em',textTransform:'uppercase',color:'#C9A84C',fontWeight:600}}>
          Unusual Volume Detection
        </div>
        <h1 style={{fontFamily:'Georgia, serif',fontSize:'48px',fontWeight:700,color:'#F7F4EF',marginBottom:'16px',lineHeight:1.1}}>
          Buyers Corner
        </h1>
        <p style={{color:'#DFC48B',fontSize:'16px',maxWidth:'580px',margin:'0 auto',lineHeight:1.7}}>
          Stocks with sudden explosions in buy or sell volume — far outside their normal trading range. When volume spikes, someone knows something.
        </p>
      </section>

      <section style={{maxWidth:'1280px',margin:'0 auto',padding:'56px 48px'}}>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'48px'}}>

          {/* BUY EXPLOSIONS */}
          <div>
            <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'24px'}}>
              <div style={{width:'10px',height:'10px',borderRadius:'50%',background:'#C9A84C'}} />
              <div style={{fontSize:'11px',letterSpacing:'0.12em',textTransform:'uppercase',color:'#C9A84C',fontWeight:600}}>Volume Buy Explosions</div>
              <div style={{fontSize:'11px',color:'#2D6A4F'}}>abnormally high buying</div>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
              {buys.length === 0 && (<div style={{ color: '#9ca3af', fontFamily: 'Georgia, serif', fontStyle: 'italic', padding: '32px 0', textAlign: 'center', gridColumn: '1 / -1' }}>No unusual-volume data connected yet — this needs a live market-data feed.</div>)}
              {buys.map(stock => (
                <Link href={'/company/' + stock.ticker} key={stock.ticker} style={{textDecoration:'none'}}>
                  <div style={{background:getSurgeBg(stock.type),border:'1px solid ' + getSurgeBorder(stock.type),borderRadius:'10px',padding:'20px 24px',cursor:'pointer',position:'relative',overflow:'hidden'}}>
                    <div style={{position:'absolute',top:0,left:0,bottom:0,width:'3px',background:'#C9A84C'}} />
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'8px'}}>
                      <div>
                        <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'4px'}}>
                          <span style={{fontFamily:'monospace',fontSize:'18px',fontWeight:800,color:'#F7F4EF'}}>{stock.ticker}</span>
                          <span style={{fontSize:'13px',color:'#DFC48B'}}>{stock.name}</span>
                        </div>
                        <span style={{background:'#2D6A4F',border:'1px solid #C9A84C',borderRadius:'100px',padding:'2px 8px',fontSize:'9px',color:'#C9A84C',letterSpacing:'0.08em',textTransform:'uppercase'}}>{stock.sector}</span>
                      </div>
                      <div style={{textAlign:'right'}}>
                        <div style={{fontSize:'28px',fontWeight:900,color:getSurgeColor(stock.type, stock.surge),lineHeight:1}}>{stock.surge}x</div>
                        <div style={{fontSize:'10px',color:'#2D6A4F',marginTop:'2px'}}>vol surge</div>
                      </div>
                    </div>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'8px',marginBottom:'10px'}}>
                      <div style={{background:'#07130E',borderRadius:'6px',padding:'8px'}}>
                        <div style={{fontSize:'9px',color:'#C9A84C',letterSpacing:'0.1em',textTransform:'uppercase',marginBottom:'2px'}}>Avg Vol</div>
                        <div style={{fontFamily:'monospace',fontSize:'12px',color:'#F7F4EF',fontWeight:600}}>{stock.avgVol}</div>
                      </div>
                      <div style={{background:'#07130E',borderRadius:'6px',padding:'8px'}}>
                        <div style={{fontSize:'9px',color:'#C9A84C',letterSpacing:'0.1em',textTransform:'uppercase',marginBottom:'2px'}}>Today</div>
                        <div style={{fontFamily:'monospace',fontSize:'12px',color:'#F7F4EF',fontWeight:600}}>{stock.todayVol}</div>
                      </div>
                      <div style={{background:'#07130E',borderRadius:'6px',padding:'8px'}}>
                        <div style={{fontSize:'9px',color:'#C9A84C',letterSpacing:'0.1em',textTransform:'uppercase',marginBottom:'2px'}}>Price</div>
                        <div style={{fontFamily:'monospace',fontSize:'12px',color:'#C9A84C',fontWeight:700}}>{stock.priceChg}</div>
                      </div>
                    </div>
                    <div style={{fontSize:'12px',color:'#DFC48B',lineHeight:1.5,fontStyle:'italic'}}>{stock.notes}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* SELL EXPLOSIONS */}
          <div>
            <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'24px'}}>
              <div style={{width:'10px',height:'10px',borderRadius:'50%',background:'#c94c4c'}} />
              <div style={{fontSize:'11px',letterSpacing:'0.12em',textTransform:'uppercase',color:'#F87171',fontWeight:600}}>Max Sell-Offs</div>
              <div style={{fontSize:'11px',color:'#2D6A4F'}}>abnormally high selling</div>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
              {sells.length === 0 && (<div style={{ color: '#9ca3af', fontFamily: 'Georgia, serif', fontStyle: 'italic', padding: '32px 0', textAlign: 'center', gridColumn: '1 / -1' }}>No unusual-volume data connected yet — this needs a live market-data feed.</div>)}
              {sells.map(stock => (
                <Link href={'/company/' + stock.ticker} key={stock.ticker} style={{textDecoration:'none'}}>
                  <div style={{background:getSurgeBg(stock.type),border:'1px solid ' + getSurgeBorder(stock.type),borderRadius:'10px',padding:'20px 24px',cursor:'pointer',position:'relative',overflow:'hidden'}}>
                    <div style={{position:'absolute',top:0,left:0,bottom:0,width:'3px',background:'#c94c4c'}} />
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'8px'}}>
                      <div>
                        <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'4px'}}>
                          <span style={{fontFamily:'monospace',fontSize:'18px',fontWeight:800,color:'#F7F4EF'}}>{stock.ticker}</span>
                          <span style={{fontSize:'13px',color:'#DFC48B'}}>{stock.name}</span>
                        </div>
                        <span style={{background:'#2d1b1b',border:'1px solid rgba(220,38,38,0.3)',borderRadius:'100px',padding:'2px 8px',fontSize:'9px',color:'#F87171',letterSpacing:'0.08em',textTransform:'uppercase'}}>{stock.sector}</span>
                      </div>
                      <div style={{textAlign:'right'}}>
                        <div style={{fontSize:'28px',fontWeight:900,color:getSurgeColor(stock.type, stock.surge),lineHeight:1}}>{stock.surge}x</div>
                        <div style={{fontSize:'10px',color:'#2D6A4F',marginTop:'2px'}}>vol surge</div>
                      </div>
                    </div>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'8px',marginBottom:'10px'}}>
                      <div style={{background:'#07130E',borderRadius:'6px',padding:'8px'}}>
                        <div style={{fontSize:'9px',color:'#F87171',letterSpacing:'0.1em',textTransform:'uppercase',marginBottom:'2px'}}>Avg Vol</div>
                        <div style={{fontFamily:'monospace',fontSize:'12px',color:'#F7F4EF',fontWeight:600}}>{stock.avgVol}</div>
                      </div>
                      <div style={{background:'#07130E',borderRadius:'6px',padding:'8px'}}>
                        <div style={{fontSize:'9px',color:'#F87171',letterSpacing:'0.1em',textTransform:'uppercase',marginBottom:'2px'}}>Today</div>
                        <div style={{fontFamily:'monospace',fontSize:'12px',color:'#F7F4EF',fontWeight:600}}>{stock.todayVol}</div>
                      </div>
                      <div style={{background:'#07130E',borderRadius:'6px',padding:'8px'}}>
                        <div style={{fontSize:'9px',color:'#F87171',letterSpacing:'0.1em',textTransform:'uppercase',marginBottom:'2px'}}>Price</div>
                        <div style={{fontFamily:'monospace',fontSize:'12px',color:'#c94c4c',fontWeight:700}}>{stock.priceChg}</div>
                      </div>
                    </div>
                    <div style={{fontSize:'12px',color:'#DFC48B',lineHeight:1.5,fontStyle:'italic'}}>{stock.notes}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* METHODOLOGY DISCLOSURE */}
      <section style={{background:'#07130E',borderTop:'2px solid #1B4332',padding:'40px 48px'}}>
        <div style={{maxWidth:'1280px',margin:'0 auto'}}>
          <div style={{background:'#1B4332',border:'1px solid #2D6A4F',borderRadius:'8px',padding:'28px'}}>
            <div style={{fontSize:'12px',fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',color:'#C9A84C',marginBottom:'16px'}}>Methodology Disclosure — How Unusual Volume Is Measured</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'24px',marginBottom:'16px'}}>
              <div>
                <div style={{fontSize:'13px',fontWeight:600,color:'#F7F4EF',marginBottom:'8px'}}>Volume Surge Calculation</div>
                <p style={{fontSize:'12px',color:'#DFC48B',lineHeight:1.7,margin:0}}>The Volume Surge Multiplier (VSM) is calculated as: <strong style={{color:'#F7F4EF'}}>VSM = Today's Total Volume / 30-Day Average Daily Volume</strong>. A VSM of 2.0 means the stock traded at double its normal volume. Alerts are triggered when VSM exceeds 2.0x. Readings above 4.0x are classified as extreme unusual activity.</p>
              </div>
              <div>
                <div style={{fontSize:'13px',fontWeight:600,color:'#F7F4EF',marginBottom:'8px'}}>Buy vs Sell Classification</div>
                <p style={{fontSize:'12px',color:'#DFC48B',lineHeight:1.7,margin:0}}>Volume is classified as a Buy Explosion when the surge is accompanied by a net positive price move and the bid-ask spread suggests more buyers than sellers (buy-side aggression). A Max Sell-Off is classified when volume spikes with price declining and sell-side aggression dominates order flow.</p>
              </div>
              <div>
                <div style={{fontSize:'13px',fontWeight:600,color:'#F7F4EF',marginBottom:'8px'}}>Data Sources</div>
                <p style={{fontSize:'12px',color:'#DFC48B',lineHeight:1.7,margin:0}}>Volume data sourced from exchange-reported consolidated tape data. 30-day averages calculated from prior 30 trading days of adjusted volume. Pre-market and after-hours volume excluded from calculations.</p>
              </div>
              <div>
                <div style={{fontSize:'13px',fontWeight:600,color:'#F7F4EF',marginBottom:'8px'}}>Important Limitations</div>
                <p style={{fontSize:'12px',color:'#DFC48B',lineHeight:1.7,margin:0}}>Unusual volume alone does not predict future price direction. Volume spikes can be caused by index rebalancing, options expiry, algorithmic trading, or random institutional transactions unrelated to any information advantage. Always verify with additional research.</p>
              </div>
            </div>
            <div style={{borderTop:'1px solid #2D6A4F',paddingTop:'16px'}}>
              <p style={{fontSize:'11px',color:'#2D6A4F',lineHeight:1.7,margin:0}}>
                <strong style={{color:'#C9A84C'}}>Disclaimer:</strong> The unusual volume data and analysis presented on this page is provided for informational purposes only and does not constitute financial advice, a trading recommendation, or an offer to buy or sell any security. The Hidden Ledger and its operators accept no liability for any trading decisions made based on this information. Volume data shown is illustrative and may not reflect real-time market conditions. Past unusual volume patterns do not guarantee similar outcomes in the future. Always conduct your own due diligence and consult a licensed financial adviser before making investment decisions.
              </p>
            </div>
          </div>
        </div>
      </section>

      <footer style={{padding:'32px 48px',borderTop:'1px solid #1B4332'}}>
        <div style={{maxWidth:'1280px',margin:'0 auto',fontSize:'11px',color:'#2D6A4F',textAlign:'center'}}>
          Volume data is illustrative. Not financial advice. 2026 The Hidden Ledger.
        </div>
      </footer>
    </main>
  )
}
