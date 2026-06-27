'use client'
import Link from 'next/link'
import { useState } from 'react'
type T={name:string;cat:string;flag:string;nw:string;firm:string;ticker:string;stock:string;action:string;value:string;date:string;notes:string}
const D:T[]=[]
const CATS=[{id:'all',label:'All'},{id:'richest',label:'Top 200 Richest'},{id:'affluent',label:'Top 100 Affluent'},{id:'entrepreneur',label:'Top 100 Entrepreneurs'},{id:'tech',label:'Top Tech Leaders'}]
const g='#C9A84C',gn='#2D6A4F',dk='#07130E',lt='#F7F4EF',md='#DFC48B'
export default function BillionairesCornerPage(){
  const[cat,setCat]=useState('all')
  const[search,setSearch]=useState('')
  const filtered=D.filter(t=>(cat==='all'||t.cat===cat)&&(!search||t.name.toLowerCase().includes(search.toLowerCase())||t.ticker.toLowerCase().includes(search.toLowerCase())))
  return(
    <main style={{background:dk,minHeight:'100vh',fontFamily:"'Inter',sans-serif",color:lt}}>
      <nav style={{background:'#1B4332',borderBottom:`1px solid ${gn}`,padding:'0 32px',height:'64px',display:'flex',alignItems:'center',justifyContent:'space-between',position:'sticky',top:0,zIndex:100}}>
        <Link href="/" style={{textDecoration:'none',display:'flex',alignItems:'center',gap:'10px'}}>
          <div style={{width:'32px',height:'32px',background:gn,border:`1px solid ${g}`,borderRadius:'6px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'16px'}}>📒</div>
          <div><span style={{fontWeight:700,fontSize:'14px',letterSpacing:'0.08em',textTransform:'uppercase',color:lt}}>THE </span><span style={{fontStyle:'italic',fontSize:'14px',color:g}}>HIDDEN </span><span style={{fontWeight:700,fontSize:'14px',letterSpacing:'0.08em',textTransform:'uppercase',color:lt}}>LEDGER</span></div>
        </Link>
      <div style={{display:'flex',gap:'24px',alignItems:'center'}}>
      <Link href="/" style={{fontSize:'13px',color:md,textTransform:'uppercase',textDecoration:'none'}}>Signals</Link>
      <Link href="/sell-alerts" style={{fontSize:'13px',color:md,textTransform:'uppercase',textDecoration:'none'}}>Sell Alerts</Link>
      <Link href="/buyers-corner" style={{fontSize:'13px',color:md,textTransform:'uppercase',textDecoration:'none'}}>Buyers Corner</Link>
      <Link href="/billionaires-corner" style={{fontSize:'13px',color:g,textTransform:'uppercase',textDecoration:'none',fontWeight:700}}>Billionaires</Link>
      <Link href="/market-pulse" style={{fontSize:'13px',color:md,textTransform:'uppercase',textDecoration:'none'}}>Market Pulse</Link>
      <Link href="/pricing" style={{background:g,color:dk,padding:'8px 20px',borderRadius:'6px',fontSize:'12px',fontWeight:700,textTransform:'uppercase',textDecoration:'none'}}>Subscribe</Link>
      </div>
      </nav>
    <section style={{background:'linear-gradient(180deg,#1B4332 0%,#07130E 100%)',padding:'48px 32px 32px',textAlign:'center'}}>
    <div style={{display:'inline-block',background:gn,border:`1px solid ${g}`,borderRadius:'100px',padding:'4px 16px',marginBottom:'16px',fontSize:'11px',letterSpacing:'0.12em',textTransform:'uppercase',color:g,fontWeight:600}}>Smart Money Tracker</div>
    <h1 style={{fontFamily:'Georgia,serif',fontSize:'40px',fontWeight:700,color:lt,marginBottom:'12px'}}>Billionaires Corner</h1>
    <p style={{color:md,fontSize:'15px',maxWidth:'520px',margin:'0 auto 24px',lineHeight:1.7}}>Top 200 Richest &bull; Top 100 Affluent &bull; Top 100 Entrepreneurs &bull; Top Tech Leaders</p>
    <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by name or ticker..." style={{background:'#1B4332',border:`1px solid ${gn}`,borderRadius:'8px',padding:'10px 16px',color:lt,fontSize:'14px',width:'100%',maxWidth:'400px',outline:'none'}}/>
    </section>
    <section style={{padding:'16px 32px',display:'flex',gap:'8px',flexWrap:'wrap',justifyContent:'center',borderBottom:`1px solid ${gn}`}}>
      {CATS.map(c=>(<button key={c.id} onClick={()=>setCat(c.id)} style={{background:cat===c.id?g:'transparent',color:cat===c.id?dk:md,border:`1px solid ${cat===c.id?g:gn}`,borderRadius:'100px',padding:'6px 16px',fontSize:'12px',fontWeight:600,cursor:'pointer',textTransform:'uppercase'}}>{c.label}</button>))}
    </section>
    <section style={{padding:'24px 32px'}}>
    <p style={{color:'#4a5568',fontSize:'12px',marginBottom:'16px'}}>{filtered.length} entries</p>
    <div style={{display:'grid',gap:'12px'}}>
      {filtered.length === 0 && (<div style={{ color: '#9ca3af', fontFamily: 'Georgia, serif', fontStyle: 'italic', padding: '40px 0', textAlign: 'center', gridColumn: '1 / -1' }}>Billionaire holdings are not connected to a live data source yet.</div>)}
      {filtered.map((t,i)=>(
      <div key={i} style={{background:'#0f1f17',border:`1px solid ${gn}`,borderRadius:'10px',padding:'20px'}}>
      <div style={{display:'flex',justifyContent:'space-between',flexWrap:'wrap',gap:'8px',marginBottom:'8px'}}>
      <div><span style={{fontSize:'16px',marginRight:'8px'}}>{t.flag}</span><span style={{fontWeight:700,fontSize:'16px',color:lt}}>{t.name}</span><span style={{color:'#4a5568',fontSize:'13px',marginLeft:'8px'}}>{t.firm}</span></div>
      <div style={{display:'flex',gap:'8px',alignItems:'center'}}><span style={{background:t.action==='BUY'?'#1a3a28':'#3a1a1a',color:t.action==='BUY'?'#4ade80':'#f87171',border:`1px solid ${t.action==='BUY'?'#2D6A4F':'#7f1d1d'}`,borderRadius:'4px',padding:'2px 10px',fontSize:'12px',fontWeight:700}}>{t.action}</span><span style={{color:g,fontWeight:700}}>{t.value}</span></div>
      </div>
      <div style={{display:'flex',gap:'16px',flexWrap:'wrap',marginBottom:'6px'}}><span style={{color:md,fontSize:'13px'}}>Net Worth: <strong style={{color:g}}>{t.nw}</strong></span><span style={{color:md,fontSize:'13px'}}><strong style={{color:lt}}>{t.ticker}</strong> &bull; {t.stock}</span><span style={{color:'#4a5568',fontSize:'12px'}}>{t.date}</span></div>
      <p style={{color:'#9ca3af',fontSize:'13px',margin:0}}>{t.notes}</p>
      </div>
      ))}
    </div>
    </section>
    </main>
    )
}
