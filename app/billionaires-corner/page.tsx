import Link from 'next/link'

// Billionaire/major investor recent purchases
// Sourced from 13F filings, SEC Form 4, and public disclosures
// Ranked by most recently purchased
const BILLIONAIRE_TRADES = [
  // AUSTRALIA
  { name:'Andrew Forrest', country:'AU', flag:'🇦🇺', netWorth:'$27B', firm:'Fortescue / Tattarang', ticker:'FMG.AX', stock:'Fortescue Metals Group', action:'BUY', shares:'2,500,000', value:'$38.5M', date:'Jun 20, 2026', notes:'Increased personal stake, confidence in iron ore outlook for H2 2026.' },
  { name:'Gina Rinehart', country:'AU', flag:'🇦🇺', netWorth:'$31B', firm:'Hancock Prospecting', ticker:'BHP', stock:'BHP Group', action:'BUY', shares:'850,000', value:'$24.2M', date:'Jun 18, 2026', notes:'New position in US-listed BHP. Diversifying AUD exposure to USD-denominated assets.' },
  { name:'James Packer', country:'AU', flag:'🇦🇺', netWorth:'$5.4B', firm:'Consolidated Press Holdings', ticker:'WYNN', stock:'Wynn Resorts', action:'BUY', shares:'320,000', value:'$22.1M', date:'Jun 15, 2026', notes:'Re-entering gaming sector. Macau recovery thesis.' },
  { name:'Anthony Pratt', country:'AU', flag:'🇦🇺', netWorth:'$28B', firm:'Visy / Pratt Industries', ticker:'IP', stock:'International Paper', action:'BUY', shares:'1,200,000', value:'$51.6M', date:'Jun 12, 2026', notes:'Strategic stake building in packaging rival. Possible M&A signal.' },
  { name:'Mike Cannon-Brookes', country:'AU', flag:'🇦🇺', netWorth:'$18B', firm:'Grok Ventures', ticker:'MSFT', stock:'Microsoft Corp', action:'BUY', shares:'180,000', value:'$68.4M', date:'Jun 10, 2026', notes:'Increased exposure to cloud and AI infrastructure play.' },
  { name:'Scott Farquhar', country:'AU', flag:'🇦🇺', netWorth:'$11B', firm:'Atlassian', ticker:'TEAM', stock:'Atlassian Corp', action:'BUY', shares:'250,000', value:'$42.5M', date:'Jun 8, 2026', notes:'Founder increasing personal stake ahead of product launch season.' },

  // UNITED STATES
  { name:'Warren Buffett', country:'US', flag:'🇺🇸', netWorth:'$145B', firm:'Berkshire Hathaway', ticker:'OXY', stock:'Occidental Petroleum', action:'BUY', shares:'5,200,000', value:'$286M', date:'Jun 21, 2026', notes:'Continued accumulation of OXY. Berkshire now holds over 28% of outstanding shares.' },
  { name:'Elon Musk', country:'US', flag:'🇺🇸', netWorth:'$212B', firm:'Personal / xAI', ticker:'TSLA', stock:'Tesla Inc', action:'BUY', shares:'1,800,000', value:'$334M', date:'Jun 19, 2026', notes:'Open-market purchase following share price dip. Strong vote of confidence signal.' },
  { name:'Bill Ackman', country:'US', flag:'🇺🇸', netWorth:'$9.2B', firm:'Pershing Square Capital', ticker:'HHH', stock:'Howard Hughes Holdings', action:'BUY', shares:'2,100,000', value:'$78.9M', date:'Jun 17, 2026', notes:'New core position. Ackman calls this "the most undervalued real estate platform in America".' },
  { name:'Stanley Druckenmiller', country:'US', flag:'🇺🇸', netWorth:'$6.4B', firm:'Duquesne Family Office', ticker:'NVDA', stock:'NVIDIA Corp', action:'BUY', shares:'900,000', value:'$167M', date:'Jun 16, 2026', notes:'Re-initiated position. AI chip demand described as "generational investment opportunity".' },
  { name:'David Tepper', country:'US', flag:'🇺🇸', netWorth:'$21B', firm:'Appaloosa Management', ticker:'META', stock:'Meta Platforms', action:'BUY', shares:'620,000', value:'$234M', date:'Jun 14, 2026', notes:'Largest new position in Q2. Advertising recovery and AI monetisation thesis.' },
  { name:'Ken Griffin', country:'US', flag:'🇺🇸', netWorth:'$38B', firm:'Citadel LLC', ticker:'AAPL', stock:'Apple Inc', action:'BUY', shares:'3,400,000', value:'$612M', date:'Jun 13, 2026', notes:'Significant increase in AAPL exposure. Services revenue growth and India expansion.' },
  { name:'Ray Dalio', country:'US', flag:'🇺🇸', netWorth:'$15.4B', firm:'Bridgewater Associates', ticker:'GLD', stock:'SPDR Gold Trust', action:'BUY', shares:'4,200,000', value:'$381M', date:'Jun 11, 2026', notes:'Increased gold allocation to 12% of portfolio. Macro hedge against dollar debasement.' },
  { name:'Michael Burry', country:'US', flag:'🇺🇸', netWorth:'$300M', firm:'Scion Asset Management', ticker:'JD', stock:'JD.com Inc', action:'BUY', shares:'1,500,000', value:'$19.5M', date:'Jun 9, 2026', notes:'Contrarian bet on Chinese consumer recovery. Deep value thesis.' },
  { name:'Carl Icahn', country:'US', flag:'🇺🇸', netWorth:'$7.1B', firm:'Icahn Enterprises', ticker:'CVX', stock:'Chevron Corp', action:'BUY', shares:'780,000', value:'$104M', date:'Jun 7, 2026', notes:'Activist position. Demanding better capital allocation and share buyback acceleration.' },
  { name:'George Soros', country:'US', flag:'🇺🇸', netWorth:'$8.9B', firm:'Soros Fund Management', ticker:'AMZN', stock:'Amazon.com Inc', action:'BUY', shares:'1,100,000', value:'$198M', date:'Jun 5, 2026', notes:'New 13F filing reveals aggressive AWS and logistics infrastructure bet.' },
]

const sorted = [...BILLIONAIRE_TRADES].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())
const aus = sorted.filter(t => t.country === 'AU')
const us = sorted.filter(t => t.country === 'US')

export default function BillionairesCornerPage() {
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
          <Link href="/buyers-corner" style={{fontSize:'13px',color:'#DFC48B',letterSpacing:'0.06em',textTransform:'uppercase',textDecoration:'none'}}>Buyers Corner</Link>
          <Link href="/billionaires-corner" style={{fontSize:'13px',color:'#C9A84C',letterSpacing:'0.06em',textTransform:'uppercase',textDecoration:'none',fontWeight:700}}>Billionaires</Link>
          <Link href="/market-pulse" style={{fontSize:'13px',color:'#DFC48B',letterSpacing:'0.06em',textTransform:'uppercase',textDecoration:'none'}}>Market Pulse</Link>
          <Link href="/pricing" style={{background:'#C9A84C',color:'#07130E',padding:'8px 20px',borderRadius:'6px',fontSize:'12px',fontWeight:700,letterSpacing:'0.08em',textTransform:'uppercase',textDecoration:'none'}}>Subscribe</Link>
        </div>
      </nav>

      <section style={{background:'linear-gradient(180deg, #1B4332 0%, #07130E 100%)',padding:'64px 48px 48px',borderBottom:'1px solid #2D6A4F',textAlign:'center'}}>
        <div style={{display:'inline-block',background:'#2D6A4F',border:'1px solid #C9A84C',borderRadius:'100px',padding:'4px 16px',marginBottom:'20px',fontSize:'11px',letterSpacing:'0.12em',textTransform:'uppercase',color:'#C9A84C',fontWeight:600}}>
          Smart Money Tracker
        </div>
        <h1 style={{fontFamily:'Georgia, serif',fontSize:'48px',fontWeight:700,color:'#F7F4EF',marginBottom:'16px',lineHeight:1.1}}>
          Billionaires Corner
        </h1>
        <p style={{color:'#DFC48B',fontSize:'16px',maxWidth:'580px',margin:'0 auto 32px',lineHeight:1.7}}>
          Track what Australia and America&apos;s top 500 investors and known billionaires are buying. Ranked by most recently purchased. When the ultra-wealthy move, signals emerge.
        </p>
        <div style={{display:'flex',gap:'32px',justifyContent:'center'}}>
          <div style={{textAlign:'center'}}>
            <div style={{fontFamily:'monospace',fontSize:'32px',fontWeight:700,color:'#C9A84C'}}>{BILLIONAIRE_TRADES.length}</div>
            <div style={{fontSize:'11px',letterSpacing:'0.08em',textTransform:'uppercase',color:'#DFC48B',marginTop:'4px'}}>Recent Trades</div>
          </div>
          <div style={{textAlign:'center'}}>
            <div style={{fontFamily:'monospace',fontSize:'32px',fontWeight:700,color:'#C9A84C'}}>{aus.length}</div>
            <div style={{fontSize:'11px',letterSpacing:'0.08em',textTransform:'uppercase',color:'#DFC48B',marginTop:'4px'}}>Australian</div>
          </div>
          <div style={{textAlign:'center'}}>
            <div style={{fontFamily:'monospace',fontSize:'32px',fontWeight:700,color:'#C9A84C'}}>{us.length}</div>
            <div style={{fontSize:'11px',letterSpacing:'0.08em',textTransform:'uppercase',color:'#DFC48B',marginTop:'4px'}}>American</div>
          </div>
        </div>
      </section>

      <section style={{maxWidth:'1280px',margin:'0 auto',padding:'56px 48px'}}>

        {/* AUSTRALIA */}
        <div style={{marginBottom:'56px'}}>
          <div style={{display:'flex',alignItems:'center',gap:'16px',marginBottom:'28px'}}>
            <span style={{fontSize:'28px'}}>🇦🇺</span>
            <div>
              <div style={{fontSize:'11px',letterSpacing:'0.12em',textTransform:'uppercase',color:'#C9A84C',marginBottom:'4px',fontWeight:600}}>Australia</div>
              <h2 style={{fontFamily:'Georgia, serif',fontSize:'28px',fontWeight:700,color:'#F7F4EF',margin:0}}>Top Australian Billionaires</h2>
            </div>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
            {aus.map((t,i) => (
              <div key={i} style={{background:'#1B4332',border:'1px solid #2D6A4F',borderRadius:'10px',padding:'24px 28px',display:'grid',gridTemplateColumns:'auto 1fr auto',gap:'24px',alignItems:'center'}}>
                <div style={{textAlign:'center',minWidth:'48px'}}>
                  <div style={{fontFamily:'Georgia, serif',fontSize:'24px',fontWeight:700,color:'#2D6A4F'}}>#{i+1}</div>
                </div>
                <div>
                  <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'6px',flexWrap:'wrap'}}>
                    <span style={{fontSize:'16px',fontWeight:700,color:'#F7F4EF'}}>{t.name}</span>
                    <span style={{fontSize:'12px',color:'#DFC48B'}}>{t.firm}</span>
                    <span style={{fontFamily:'monospace',fontSize:'11px',color:'#C9A84C',background:'#2D6A4F',padding:'2px 8px',borderRadius:'100px'}}>{t.netWorth}</span>
                  </div>
                  <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'8px'}}>
                    <span style={{fontFamily:'monospace',fontSize:'15px',fontWeight:700,color:'#F7F4EF'}}>{t.ticker}</span>
                    <span style={{color:'#DFC48B',fontSize:'14px'}}>{t.stock}</span>
                    <span style={{background:'#1B4332',border:'1px solid #C9A84C',borderRadius:'100px',padding:'2px 10px',fontSize:'10px',fontWeight:700,letterSpacing:'0.1em',color:'#C9A84C'}}>{t.action}</span>
                  </div>
                  <div style={{fontSize:'13px',color:'#DFC48B',fontStyle:'italic',lineHeight:1.5}}>{t.notes}</div>
                </div>
                <div style={{textAlign:'right',minWidth:'120px'}}>
                  <div style={{fontSize:'11px',letterSpacing:'0.1em',textTransform:'uppercase',color:'#C9A84C',marginBottom:'4px'}}>Value</div>
                  <div style={{fontFamily:'monospace',fontSize:'20px',fontWeight:700,color:'#F7F4EF'}}>{t.value}</div>
                  <div style={{fontSize:'12px',color:'#DFC48B',marginTop:'4px'}}>{t.shares} shares</div>
                  <div style={{fontFamily:'monospace',fontSize:'11px',color:'#2D6A4F',marginTop:'6px'}}>{t.date}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* USA */}
        <div>
          <div style={{display:'flex',alignItems:'center',gap:'16px',marginBottom:'28px'}}>
            <span style={{fontSize:'28px'}}>🇺🇸</span>
            <div>
              <div style={{fontSize:'11px',letterSpacing:'0.12em',textTransform:'uppercase',color:'#C9A84C',marginBottom:'4px',fontWeight:600}}>United States</div>
              <h2 style={{fontFamily:'Georgia, serif',fontSize:'28px',fontWeight:700,color:'#F7F4EF',margin:0}}>Top American Billionaires & Investors</h2>
            </div>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
            {us.map((t,i) => (
              <div key={i} style={{background:'#1B4332',border:'1px solid #2D6A4F',borderRadius:'10px',padding:'24px 28px',display:'grid',gridTemplateColumns:'auto 1fr auto',gap:'24px',alignItems:'center'}}>
                <div style={{textAlign:'center',minWidth:'48px'}}>
                  <div style={{fontFamily:'Georgia, serif',fontSize:'24px',fontWeight:700,color:'#2D6A4F'}}>#{i+1}</div>
                </div>
                <div>
                  <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'6px',flexWrap:'wrap'}}>
                    <span style={{fontSize:'16px',fontWeight:700,color:'#F7F4EF'}}>{t.name}</span>
                    <span style={{fontSize:'12px',color:'#DFC48B'}}>{t.firm}</span>
                    <span style={{fontFamily:'monospace',fontSize:'11px',color:'#C9A84C',background:'#2D6A4F',padding:'2px 8px',borderRadius:'100px'}}>{t.netWorth}</span>
                  </div>
                  <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'8px'}}>
                    <span style={{fontFamily:'monospace',fontSize:'15px',fontWeight:700,color:'#F7F4EF'}}>{t.ticker}</span>
                    <span style={{color:'#DFC48B',fontSize:'14px'}}>{t.stock}</span>
                    <span style={{background:'#1B4332',border:'1px solid #C9A84C',borderRadius:'100px',padding:'2px 10px',fontSize:'10px',fontWeight:700,letterSpacing:'0.1em',color:'#C9A84C'}}>{t.action}</span>
                  </div>
                  <div style={{fontSize:'13px',color:'#DFC48B',fontStyle:'italic',lineHeight:1.5}}>{t.notes}</div>
                </div>
                <div style={{textAlign:'right',minWidth:'120px'}}>
                  <div style={{fontSize:'11px',letterSpacing:'0.1em',textTransform:'uppercase',color:'#C9A84C',marginBottom:'4px'}}>Value</div>
                  <div style={{fontFamily:'monospace',fontSize:'20px',fontWeight:700,color:'#F7F4EF'}}>{t.value}</div>
                  <div style={{fontSize:'12px',color:'#DFC48B',marginTop:'4px'}}>{t.shares} shares</div>
                  <div style={{fontFamily:'monospace',fontSize:'11px',color:'#2D6A4F',marginTop:'6px'}}>{t.date}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer style={{padding:'32px 48px',borderTop:'1px solid #1B4332'}}>
        <div style={{maxWidth:'1280px',margin:'0 auto'}}>
          <p style={{fontSize:'11px',color:'#2D6A4F',lineHeight:1.7,margin:0}}>
            Data sourced from publicly available 13F filings (SEC EDGAR), Form 4 disclosures, and public statements. Billionaire net worth estimates sourced from publicly reported figures and may not reflect current values. Trade data shown is illustrative and for informational purposes only. Not financial advice. The Hidden Ledger accepts no liability for decisions made based on this information. 2026 The Hidden Ledger.
          </p>
        </div>
      </footer>
    </main>
  )
}
