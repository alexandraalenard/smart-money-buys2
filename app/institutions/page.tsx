import Link from 'next/link'

export default function InstitutionsPage() {
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
          <Link href="/sell-alerts" style={{fontSize:'13px',color:'#C9A84C',letterSpacing:'0.06em',textTransform:'uppercase',textDecoration:'none',fontWeight:700}}>Sell Alerts</Link>
          <Link href="/congress" style={{fontSize:'13px',color:'#DFC48B',letterSpacing:'0.06em',textTransform:'uppercase',textDecoration:'none',opacity:0.5}}>Congress</Link>
          <Link href="/institutions" style={{fontSize:'13px',color:'#DFC48B',letterSpacing:'0.06em',textTransform:'uppercase',textDecoration:'none'}}>Institutions</Link>
          <Link href="/pricing" style={{background:'#C9A84C',color:'#07130E',padding:'8px 20px',borderRadius:'6px',fontSize:'12px',fontWeight:700,letterSpacing:'0.08em',textTransform:'uppercase',textDecoration:'none'}}>Subscribe</Link>
        </div>
      </nav>

      <section style={{background:'linear-gradient(180deg, #1B4332 0%, #07130E 100%)',padding:'80px 48px 64px',borderBottom:'1px solid #2D6A4F',textAlign:'center'}}>
        <div style={{display:'inline-block',background:'#2D6A4F',border:'1px solid #C9A84C',borderRadius:'100px',padding:'4px 16px',marginBottom:'24px',fontSize:'11px',letterSpacing:'0.12em',textTransform:'uppercase',color:'#C9A84C',fontWeight:600}}>Coming Soon</div>
        <h1 style={{fontFamily:'Georgia, serif',fontSize:'52px',fontWeight:700,color:'#F7F4EF',marginBottom:'16px',lineHeight:1.1}}>
          Institutional<br /><span style={{fontStyle:'italic',color:'#C9A84C'}}>13F Filings</span>
        </h1>
        <p style={{color:'#DFC48B',fontSize:'18px',maxWidth:'560px',margin:'0 auto 40px',lineHeight:1.7}}>
          Track what hedge funds and asset managers are buying and selling every quarter. When Berkshire accumulates or Bridgewater dumps, be first to know.
        </p>
        <div style={{display:'flex',gap:'24px',justifyContent:'center',flexWrap:'wrap'}}>
          {[
            {icon:'🏦',label:'Hedge Funds',desc:'Quarterly 13F position changes'},
            {icon:'📈',label:'Asset Managers',desc:'Mutual funds and ETF holdings'},
            {icon:'🔍',label:'New Positions',desc:'Fresh institutional buys'},
          ].map(({icon,label,desc})=>(
            <div key={label} style={{background:'#1B4332',border:'1px solid #2D6A4F',borderRadius:'10px',padding:'24px',minWidth:'180px',textAlign:'center'}}>
              <div style={{fontSize:'28px',marginBottom:'8px'}}>{icon}</div>
              <div style={{fontSize:'14px',fontWeight:600,color:'#F7F4EF',marginBottom:'4px'}}>{label}</div>
              <div style={{fontSize:'12px',color:'#DFC48B'}}>{desc}</div>
            </div>
          ))}
        </div>
      </section>

      <section style={{maxWidth:'640px',margin:'0 auto',padding:'72px 48px',textAlign:'center'}}>
        <h2 style={{fontFamily:'Georgia, serif',fontSize:'28px',fontWeight:700,color:'#F7F4EF',marginBottom:'12px'}}>Be first when it launches</h2>
        <p style={{color:'#DFC48B',fontSize:'14px',marginBottom:'32px'}}>We are integrating SEC EDGAR 13F data for the top 500 institutional managers. Subscribe to access it first.</p>
        <Link href="/pricing" style={{display:'inline-block',background:'#C9A84C',color:'#07130E',padding:'14px 32px',borderRadius:'6px',fontSize:'14px',fontWeight:700,letterSpacing:'0.06em',textTransform:'uppercase',textDecoration:'none'}}>Subscribe for Early Access</Link>
      </section>

      <footer style={{padding:'32px 48px',borderTop:'1px solid #1B4332'}}>
        <div style={{maxWidth:'1280px',margin:'0 auto',fontSize:'11px',color:'#2D6A4F'}}>* Source: SEC EDGAR 13F filings. All data publicly available. Not financial advice.</div>
      </footer>
    </main>
  )
}
