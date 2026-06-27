import Link from 'next/link'

const TODAY = 'June 26, 2026'

const NEWS_ITEMS: { tickers: any[]; tags: any[]; [key: string]: any }[] = []

function getImpactColor(impact: string) {
  if (impact === 'HIGH') return '#c94c4c'
  if (impact === 'MEDIUM') return '#C9A84C'
  return '#2D6A4F'
}

function getCategoryColor(cat: string) {
  const map: Record<string, string> = {
    'TECH':'#C9A84C','ENERGY':'#DFC48B','HEALTHCARE':'#F87171',
    'FINANCIALS':'#2D6A4F','CONSUMER':'#DFC48B','MACRO':'#9CA3AF',
    'EV':'#C9A84C'
  }
  return map[cat] || '#DFC48B'
}

export default function MarketPulsePage() {
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
          <Link href="/market-pulse" style={{fontSize:'13px',color:'#C9A84C',letterSpacing:'0.06em',textTransform:'uppercase',textDecoration:'none',fontWeight:700}}>Market Pulse</Link>
          <Link href="/billionaires-corner" style={{fontSize:'13px',color:'#DFC48B',letterSpacing:'0.06em',textTransform:'uppercase',textDecoration:'none'}}>Billionaires</Link>
          <Link href="/buyers-corner" style={{fontSize:'13px',color:'#DFC48B',letterSpacing:'0.06em',textTransform:'uppercase',textDecoration:'none'}}>Buyers Corner</Link>
          <Link href="/pricing" style={{background:'#C9A84C',color:'#07130E',padding:'8px 20px',borderRadius:'6px',fontSize:'12px',fontWeight:700,letterSpacing:'0.08em',textTransform:'uppercase',textDecoration:'none'}}>Subscribe</Link>
        </div>
      </nav>

      <section style={{background:'linear-gradient(180deg, #1B4332 0%, #07130E 100%)',padding:'64px 48px 48px',borderBottom:'1px solid #2D6A4F'}}>
        <div style={{maxWidth:'1280px',margin:'0 auto',display:'grid',gridTemplateColumns:'1fr auto',alignItems:'end',gap:'32px'}}>
          <div>
            <div style={{display:'inline-block',background:'#2D6A4F',border:'1px solid #C9A84C',borderRadius:'100px',padding:'4px 16px',marginBottom:'20px',fontSize:'11px',letterSpacing:'0.12em',textTransform:'uppercase',color:'#C9A84C',fontWeight:600}}>
              AI Daily Digest
            </div>
            <h1 style={{fontFamily:'Georgia, serif',fontSize:'48px',fontWeight:700,color:'#F7F4EF',marginBottom:'16px',lineHeight:1.1}}>
              Market Pulse
            </h1>
            <p style={{color:'#DFC48B',fontSize:'16px',maxWidth:'560px',lineHeight:1.7,margin:0}}>
              Every news event that could move the top 500 stocks — with insider buy and sell signals called out. Updated daily.
            </p>
          </div>
          <div style={{textAlign:'right'}}>
            <div style={{fontSize:'11px',letterSpacing:'0.1em',textTransform:'uppercase',color:'#C9A84C',marginBottom:'4px'}}>Last Updated</div>
            <div style={{fontFamily:'monospace',fontSize:'16px',color:'#F7F4EF',fontWeight:700}}>{TODAY}</div>
            <div style={{fontSize:'12px',color:'#2D6A4F',marginTop:'4px'}}>6:00 AM UTC · Next update in 18h</div>
          </div>
        </div>
      </section>

      <section style={{maxWidth:'1280px',margin:'0 auto',padding:'56px 48px'}}>
        <div style={{display:'grid',gridTemplateColumns:'1fr 360px',gap:'48px',alignItems:'start'}}>

          {/* MAIN NEWS FEED */}
          <div style={{display:'flex',flexDirection:'column',gap:'20px'}}>
            {NEWS_ITEMS.length === 0 && (<div style={{ color: '#9ca3af', fontFamily: 'Georgia, serif', fontStyle: 'italic', padding: '40px 0', textAlign: 'center' }}>Live market data is not connected yet — check back soon.</div>)}
              {NEWS_ITEMS.map(item => (
              <div key={item.id} style={{background:'#1B4332',border:'1px solid #2D6A4F',borderRadius:'10px',padding:'28px',position:'relative',overflow:'hidden'}}>
                <div style={{position:'absolute',top:0,left:0,right:0,height:'2px',background:item.insiderSignal==='BUY'?'linear-gradient(90deg, #C9A84C, #DFC48B)':item.insiderSignal==='SELL'?'linear-gradient(90deg, #c94c4c, #F87171)':'linear-gradient(90deg, #2D6A4F, #1B4332)'}} />

                <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:'12px',gap:'16px'}}>
                  <div style={{display:'flex',gap:'8px',alignItems:'center',flexWrap:'wrap'}}>
                    <span style={{background:'#07130E',border:'1px solid ' + getCategoryColor(item.category),borderRadius:'100px',padding:'3px 10px',fontSize:'10px',fontWeight:700,letterSpacing:'0.1em',color:getCategoryColor(item.category)}}>{item.category}</span>
                    <span style={{background:'#07130E',border:'1px solid ' + getImpactColor(item.impact),borderRadius:'100px',padding:'3px 10px',fontSize:'10px',fontWeight:700,letterSpacing:'0.1em',color:getImpactColor(item.impact)}}>{item.impact} IMPACT</span>
                    {item.tickers.map(t=>(
                      <Link key={t} href={'/company/'+t} style={{fontFamily:'monospace',fontSize:'11px',fontWeight:700,color:'#C9A84C',background:'#2D6A4F',padding:'2px 8px',borderRadius:'4px',textDecoration:'none'}}>{t}</Link>
                    ))}
                  </div>
                  <div style={{fontSize:'11px',color:'#2D6A4F',whiteSpace:'nowrap'}}>{item.timeAgo}</div>
                </div>

                <h3 style={{fontFamily:'Georgia, serif',fontSize:'18px',fontWeight:700,color:'#F7F4EF',marginBottom:'10px',lineHeight:1.3}}>{item.headline}</h3>
                <p style={{fontSize:'14px',color:'#DFC48B',lineHeight:1.7,marginBottom:'16px'}}>{item.summary}</p>

                {/* INSIDER SIGNAL BOX */}
                <div style={{background:'#07130E',border:'1px solid ' + (item.insiderSignal==='BUY'?'rgba(201,168,76,0.3)':item.insiderSignal==='SELL'?'rgba(220,38,38,0.3)':'rgba(45,106,79,0.3)'),borderRadius:'6px',padding:'12px 16px',display:'flex',gap:'12px',alignItems:'flex-start'}}>
                  <span style={{fontSize:'16px',marginTop:'1px'}}>{item.insiderSignal==='BUY'?'📈':item.insiderSignal==='SELL'?'📉':'➡️'}</span>
                  <div>
                    <div style={{fontSize:'10px',letterSpacing:'0.1em',textTransform:'uppercase',color:item.insiderSignal==='BUY'?'#C9A84C':item.insiderSignal==='SELL'?'#F87171':'#2D6A4F',fontWeight:700,marginBottom:'4px'}}>
                      Insider Signal: {item.insiderSignal}
                    </div>
                    <div style={{fontSize:'13px',color:'#DFC48B'}}>{item.insiderNote}</div>
                  </div>
                </div>

                <div style={{display:'flex',gap:'8px',marginTop:'14px',flexWrap:'wrap'}}>
                  {item.tags.map(tag=>(
                    <span key={tag} style={{background:'#2D6A4F',color:'#DFC48B',padding:'3px 10px',borderRadius:'100px',fontSize:'11px'}}>{tag}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* SIDEBAR */}
          <div style={{display:'flex',flexDirection:'column',gap:'20px'}}>
            <div style={{background:'#1B4332',border:'1px solid #2D6A4F',borderRadius:'10px',padding:'24px',position:'sticky',top:'80px'}}>
              <div style={{fontSize:'11px',letterSpacing:'0.12em',textTransform:'uppercase',color:'#C9A84C',marginBottom:'16px',fontWeight:600}}>Today&apos;s Insider Signals</div>
              {NEWS_ITEMS.filter(n=>n.insiderSignal!=='NEUTRAL').map(item=>(
                <div key={item.id} style={{display:'flex',gap:'10px',alignItems:'flex-start',padding:'10px 0',borderBottom:'1px solid #2D6A4F'}}>
                  <span style={{fontSize:'14px'}}>{item.insiderSignal==='BUY'?'🟢':'🔴'}</span>
                  <div style={{flex:1}}>
                    <div style={{display:'flex',gap:'6px',marginBottom:'3px'}}>
                      {item.tickers.slice(0,2).map(t=>(
                        <span key={t} style={{fontFamily:'monospace',fontSize:'12px',fontWeight:700,color:'#F7F4EF'}}>{t}</span>
                      ))}
                    </div>
                    <div style={{fontSize:'11px',color:'#DFC48B',lineHeight:1.4}}>{item.insiderNote.substring(0,80)}...</div>
                  </div>
                </div>
              ))}

              <div style={{marginTop:'20px',paddingTop:'16px',borderTop:'1px solid #2D6A4F'}}>
                <div style={{fontSize:'11px',letterSpacing:'0.12em',textTransform:'uppercase',color:'#C9A84C',marginBottom:'12px',fontWeight:600}}>High Impact Today</div>
                {NEWS_ITEMS.filter(n=>n.impact==='HIGH').map(item=>(
                  <div key={item.id} style={{padding:'8px 0',borderBottom:'1px solid #07130E'}}>
                    <div style={{fontSize:'12px',fontWeight:600,color:'#F7F4EF',marginBottom:'2px',lineHeight:1.3}}>{item.headline.substring(0,55)}...</div>
                    <div style={{fontSize:'10px',color:'#2D6A4F'}}>{item.category} · {item.timeAgo}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer style={{padding:'32px 48px',borderTop:'1px solid #1B4332'}}>
        <div style={{maxWidth:'1280px',margin:'0 auto'}}>
          <p style={{fontSize:'11px',color:'#2D6A4F',lineHeight:1.7,margin:0}}>
            Market Pulse summaries are AI-generated for informational purposes only. News items are illustrative examples of the type of content this feature will provide when integrated with live news APIs. Insider trade references are based on publicly available SEC filings. Nothing on this page constitutes financial advice or an investment recommendation. The Hidden Ledger accepts no liability for any investment decisions made based on this content. All data publicly available. Not financial advice. 2026 The Hidden Ledger.
          </p>
        </div>
      </footer>
    </main>
  )
}
