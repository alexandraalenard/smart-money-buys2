import Link from 'next/link'

export default function PricingPage() {
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
        <Link href="/" style={{fontSize:'13px',color:'#DFC48B',textDecoration:'none'}}>Back to signals</Link>
      </nav>

      <section style={{background:'linear-gradient(180deg, #1B4332 0%, #07130E 100%)',padding:'80px 48px 64px',borderBottom:'1px solid #2D6A4F',textAlign:'center'}}>
        <h1 style={{fontFamily:'Georgia, serif',fontSize:'52px',fontWeight:700,color:'#F7F4EF',marginBottom:'16px',lineHeight:1.1}}>
          The signal is in the data.<br /><span style={{fontStyle:'italic',color:'#C9A84C'}}>Not the noise.</span>
        </h1>
        <p style={{color:'#DFC48B',fontSize:'18px',maxWidth:'560px',margin:'0 auto',lineHeight:1.7}}>
          Get unlimited access to all ranked signals, company pages, insider filings and sell alerts.
        </p>
      </section>

      <section style={{maxWidth:'1000px',margin:'0 auto',padding:'72px 48px'}}>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'32px'}}>
          <div style={{background:'#1B4332',border:'1px solid #2D6A4F',borderRadius:'12px',padding:'40px'}}>
            <div style={{fontSize:'13px',letterSpacing:'0.1em',textTransform:'uppercase',color:'#DFC48B',marginBottom:'8px',fontWeight:600}}>Free</div>
            <div style={{fontFamily:'Georgia, serif',fontSize:'48px',fontWeight:700,color:'#F7F4EF',lineHeight:1,marginBottom:'4px'}}>$0</div>
            <div style={{fontSize:'14px',color:'#DFC48B',marginBottom:'32px'}}>Forever</div>
            {['Top 3 ranked companies','SEC sell alerts','Weekly digest'].map(f=>(
              <div key={f} style={{display:'flex',gap:'10px',fontSize:'14px',color:'#DFC48B',marginBottom:'10px'}}>
                <span style={{color:'#2D6A4F',fontWeight:700}}>+</span>{f}
              </div>
            ))}
            {['Full ranked list','All company pages','Trade-level data','Congress + institutions'].map(f=>(
              <div key={f} style={{display:'flex',gap:'10px',fontSize:'14px',color:'#2D6A4F',marginBottom:'10px',textDecoration:'line-through'}}>
                <span>-</span>{f}
              </div>
            ))}
            <Link href="/" style={{display:'block',textAlign:'center',border:'1px solid #2D6A4F',color:'#DFC48B',padding:'14px',borderRadius:'6px',marginTop:'24px',textDecoration:'none',fontSize:'14px',fontWeight:600}}>
              Continue Free
            </Link>
          </div>

          <div style={{background:'#1B4332',border:'2px solid #C9A84C',borderRadius:'12px',padding:'40px',position:'relative',overflow:'hidden'}}>
            <div style={{position:'absolute',top:0,left:0,right:0,height:'3px',background:'linear-gradient(90deg, #C9A84C, #DFC48B)'}} />
            <div style={{display:'inline-block',background:'#C9A84C',color:'#07130E',borderRadius:'100px',padding:'3px 12px',fontSize:'10px',fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',marginBottom:'12px'}}>Most Popular</div>
            <div style={{fontSize:'13px',letterSpacing:'0.1em',textTransform:'uppercase',color:'#C9A84C',marginBottom:'8px',fontWeight:600}}>Pro</div>
            <div style={{display:'flex',alignItems:'baseline',gap:'8px',marginBottom:'4px'}}>
              <span style={{fontFamily:'Georgia, serif',fontSize:'48px',fontWeight:700,color:'#F7F4EF',lineHeight:1}}>$19</span>
              <span style={{fontSize:'16px',color:'#DFC48B'}}>/month</span>
            </div>
            <div style={{fontSize:'13px',color:'#2D6A4F',marginBottom:'32px'}}>or $149/year (save 35%)</div>
            {['All 97+ companies ranked','Full company detail pages','Complete trade-level data','Sell alerts + full context','Congress trading disclosures','Institutional 13F filings','Daily AI score updates'].map(f=>(
              <div key={f} style={{display:'flex',gap:'10px',fontSize:'14px',color:'#DFC48B',marginBottom:'10px'}}>
                <span style={{color:'#C9A84C',fontWeight:700}}>+</span>{f}
              </div>
            ))}
            <button style={{display:'block',width:'100%',background:'#C9A84C',color:'#07130E',border:'none',padding:'16px',borderRadius:'6px',fontSize:'14px',fontWeight:700,letterSpacing:'0.06em',textTransform:'uppercase',cursor:'pointer',marginTop:'24px'}}>
              Get Full Access — $19/mo
            </button>
            <div style={{fontSize:'11px',color:'#2D6A4F',textAlign:'center',marginTop:'12px'}}>Cancel anytime · Stripe payments coming soon</div>
          </div>
        </div>

        <div style={{marginTop:'64px'}}>
          <div style={{fontSize:'11px',letterSpacing:'0.12em',textTransform:'uppercase',color:'#C9A84C',marginBottom:'20px',fontWeight:600,textAlign:'center'}}>FAQ</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'16px'}}>
            {[
              {q:'What data sources?',a:'SEC Form 4 insider filings, congressional STOCK Act disclosures, and institutional 13F filings. All publicly available.'},
              {q:'How often updated?',a:'SEC pipeline runs daily at 6am UTC. AI scores recalculate after each new batch of filings.'},
              {q:'Is this financial advice?',a:'No. All data is public information. Nothing here constitutes financial advice. Do your own research.'},
              {q:'How do I cancel?',a:'Cancel anytime. No lock-in. Full refund within 7 days if not satisfied.'},
            ].map(({q,a})=>(
              <div key={q} style={{background:'#1B4332',border:'1px solid #2D6A4F',borderRadius:'8px',padding:'20px'}}>
                <div style={{fontSize:'14px',fontWeight:600,color:'#F7F4EF',marginBottom:'8px'}}>{q}</div>
                <div style={{fontSize:'13px',color:'#DFC48B',lineHeight:1.6}}>{a}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer style={{padding:'32px 48px',borderTop:'1px solid #1B4332',textAlign:'center'}}>
        <div style={{fontSize:'11px',color:'#2D6A4F'}}>Not financial advice. 2026 The Hidden Ledger.</div>
      </footer>
    </main>
  )
}
