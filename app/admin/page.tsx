'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import Link from 'next/link'

const ADMIN_PW = 'ledger2026'

export default function AdminPage() {
  const [authed, setAuthed] = useState(false)
  const [pw, setPw] = useState('')
  const [cronLogs, setCronLogs] = useState<any[]>([])
  const [trades, setTrades] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [pipelineMsg, setPipelineMsg] = useState('')
  const [scoreMsg, setScoreMsg] = useState('')

  useEffect(() => { if (authed) loadData() }, [authed])

  async function loadData() {
    setLoading(true)
    const { data: logs } = await supabase.from('cron_logs').select('*').order('ran_at',{ascending:false}).limit(10)
    if (logs) setCronLogs(logs)
    const { data: t } = await supabase.from('insider_transactions').select('*, companies(ticker, name), insiders(name, title)').order('transaction_date',{ascending:false}).limit(20)
    if (t) setTrades(t)
    setLoading(false)
  }

  async function runPipeline() {
    setPipelineMsg('Running...')
    try {
      const r = await fetch('/api/fetch-filings', { method: 'POST' })
      const d = await r.json()
      setPipelineMsg('Done: ' + JSON.stringify(d))
      loadData()
    } catch(e) { setPipelineMsg('Error: ' + String(e)) }
  }

  async function runScoring() {
    setScoreMsg('Calculating...')
    try {
      const r = await fetch('/api/calculate-scores', { method: 'POST' })
      const d = await r.json()
      setScoreMsg('Done: ' + JSON.stringify(d))
    } catch(e) { setScoreMsg('Error: ' + String(e)) }
  }

  function fmtDate(d: string) {
    if (!d) return ''
    try { return new Date(d).toLocaleString('en-US',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'}) } catch { return d }
  }

  if (!authed) return (
    <main style={{background:'#07130E',minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"'Inter', sans-serif"}}>
      <div style={{background:'#1B4332',border:'1px solid #2D6A4F',borderRadius:'12px',padding:'48px',maxWidth:'360px',width:'100%',textAlign:'center'}}>
        <div style={{fontSize:'32px',marginBottom:'16px'}}>📒</div>
        <h1 style={{fontFamily:'Georgia, serif',fontSize:'24px',color:'#F7F4EF',marginBottom:'8px'}}>Admin Access</h1>
        <p style={{color:'#DFC48B',fontSize:'14px',marginBottom:'32px'}}>The Hidden Ledger internal dashboard</p>
        <input type="password" placeholder="Password" value={pw} onChange={e=>setPw(e.target.value)} onKeyDown={e=>e.key==='Enter'&&(pw===ADMIN_PW?setAuthed(true):setPw(''))} style={{width:'100%',background:'#07130E',border:'1px solid #2D6A4F',borderRadius:'6px',padding:'12px 16px',color:'#F7F4EF',fontSize:'14px',outline:'none',marginBottom:'12px',boxSizing:'border-box'}} />
        <button onClick={()=>pw===ADMIN_PW?setAuthed(true):setPw('')} style={{width:'100%',background:'#C9A84C',color:'#07130E',border:'none',padding:'12px',borderRadius:'6px',fontSize:'14px',fontWeight:700,cursor:'pointer'}}>Enter</button>
      </div>
    </main>
  )

  return (
    <main style={{background:'#07130E',minHeight:'100vh',fontFamily:"'Inter', sans-serif",color:'#F7F4EF'}}>
      <nav style={{background:'#1B4332',borderBottom:'1px solid #2D6A4F',padding:'0 48px',height:'64px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
          <span style={{fontSize:'20px'}}>📒</span>
          <span style={{fontWeight:700,fontSize:'14px',color:'#F7F4EF',letterSpacing:'0.08em'}}>ADMIN DASHBOARD</span>
        </div>
        <Link href="/" style={{color:'#DFC48B',textDecoration:'none',fontSize:'13px'}}>Back to site</Link>
      </nav>

      <div style={{maxWidth:'1280px',margin:'0 auto',padding:'48px'}}>
        <h1 style={{fontFamily:'Georgia, serif',fontSize:'32px',color:'#F7F4EF',marginBottom:'8px'}}>The Hidden Ledger Admin</h1>
        <p style={{color:'#DFC48B',marginBottom:'40px'}}>Internal operations dashboard</p>

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'24px',marginBottom:'40px'}}>
          <div style={{background:'#1B4332',border:'1px solid #2D6A4F',borderRadius:'10px',padding:'28px'}}>
            <div style={{fontSize:'11px',letterSpacing:'0.12em',textTransform:'uppercase',color:'#C9A84C',marginBottom:'12px',fontWeight:600}}>SEC Pipeline</div>
            <p style={{fontSize:'13px',color:'#DFC48B',marginBottom:'20px',lineHeight:1.6}}>Fetches Form 4 filings via sec-api.io, parses XML, stores trades. Uses API credits — use sparingly.</p>
            <button onClick={runPipeline} style={{background:'#C9A84C',color:'#07130E',border:'none',padding:'10px 24px',borderRadius:'6px',fontSize:'13px',fontWeight:700,cursor:'pointer',marginBottom:'12px'}}>Run Fetch Filings</button>
            {pipelineMsg&&<div style={{fontSize:'12px',color:'#DFC48B',background:'#07130E',padding:'10px',borderRadius:'6px',fontFamily:'monospace',wordBreak:'break-all'}}>{pipelineMsg}</div>}
          </div>
          <div style={{background:'#1B4332',border:'1px solid #2D6A4F',borderRadius:'10px',padding:'28px'}}>
            <div style={{fontSize:'11px',letterSpacing:'0.12em',textTransform:'uppercase',color:'#C9A84C',marginBottom:'12px',fontWeight:600}}>Score Calculation</div>
            <p style={{fontSize:'13px',color:'#DFC48B',marginBottom:'20px',lineHeight:1.6}}>Recalculates AI confidence scores. Run after fetching new filings.</p>
            <button onClick={runScoring} style={{background:'#2D6A4F',color:'#F7F4EF',border:'1px solid #C9A84C',padding:'10px 24px',borderRadius:'6px',fontSize:'13px',fontWeight:700,cursor:'pointer',marginBottom:'12px'}}>Recalculate Scores</button>
            {scoreMsg&&<div style={{fontSize:'12px',color:'#DFC48B',background:'#07130E',padding:'10px',borderRadius:'6px',fontFamily:'monospace',wordBreak:'break-all'}}>{scoreMsg}</div>}
          </div>
        </div>

        {loading&&<div style={{textAlign:'center',color:'#2D6A4F',padding:'40px',fontStyle:'italic'}}>Loading...</div>}

        {cronLogs.length>0&&(
          <div style={{marginBottom:'40px'}}>
            <div style={{fontSize:'11px',letterSpacing:'0.12em',textTransform:'uppercase',color:'#C9A84C',marginBottom:'16px',fontWeight:600}}>Cron Logs</div>
            <div style={{background:'#1B4332',border:'1px solid #2D6A4F',borderRadius:'10px',overflow:'hidden'}}>
              <div style={{display:'grid',gridTemplateColumns:'160px 80px 80px 80px 1fr',borderBottom:'1px solid #2D6A4F',padding:'10px 20px'}}>
                {['Ran At','Status','Filings','Trades','Errors'].map(h=><div key={h} style={{fontSize:'10px',letterSpacing:'0.1em',textTransform:'uppercase',color:'#C9A84C',fontWeight:600}}>{h}</div>)}
              </div>
              {cronLogs.map((log,i)=>(
                <div key={log.id} style={{display:'grid',gridTemplateColumns:'160px 80px 80px 80px 1fr',padding:'12px 20px',borderBottom:i<cronLogs.length-1?'1px solid #2D6A4F':'none',alignItems:'center'}}>
                  <div style={{fontFamily:'monospace',fontSize:'12px',color:'#DFC48B'}}>{fmtDate(log.ran_at)}</div>
                  <div><span style={{background:log.status==='success'?'#1B4332':'#2d1b1b',border:'1px solid '+(log.status==='success'?'#C9A84C':'#c94c4c'),borderRadius:'100px',padding:'2px 8px',fontSize:'10px',fontWeight:700,color:log.status==='success'?'#C9A84C':'#c94c4c'}}>{log.status||'?'}</span></div>
                  <div style={{fontFamily:'monospace',fontSize:'13px',color:'#F7F4EF'}}>{log.filings_found||0}</div>
                  <div style={{fontFamily:'monospace',fontSize:'13px',color:'#F7F4EF'}}>{log.trades_inserted||0}</div>
                  <div style={{fontSize:'11px',color:'#F87171',fontFamily:'monospace',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{log.errors||'—'}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {trades.length>0&&(
          <div>
            <div style={{fontSize:'11px',letterSpacing:'0.12em',textTransform:'uppercase',color:'#C9A84C',marginBottom:'16px',fontWeight:600}}>Recent Trades ({trades.length})</div>
            <div style={{background:'#1B4332',border:'1px solid #2D6A4F',borderRadius:'10px',overflow:'hidden'}}>
              <div style={{display:'grid',gridTemplateColumns:'70px 1fr 1fr 70px 90px 110px',borderBottom:'1px solid #2D6A4F',padding:'10px 20px'}}>
                {['Ticker','Insider','Title','Type','Value','Date'].map(h=><div key={h} style={{fontSize:'10px',letterSpacing:'0.1em',textTransform:'uppercase',color:'#C9A84C',fontWeight:600}}>{h}</div>)}
              </div>
              {trades.map((t,i)=>{
                const val=(t.shares||0)*(t.price||0)
                const fv=val>=1000000?'$'+(val/1000000).toFixed(1)+'M':val>=1000?'$'+(val/1000).toFixed(0)+'K':'$'+val.toLocaleString()
                const isSell=['S','SELL','s','sell'].includes(t.transaction_type||'')
                return (
                  <div key={t.id} style={{display:'grid',gridTemplateColumns:'70px 1fr 1fr 70px 90px 110px',padding:'12px 20px',borderBottom:i<trades.length-1?'1px solid #2D6A4F':'none',alignItems:'center'}}>
                    <div style={{fontFamily:'monospace',fontSize:'14px',fontWeight:700,color:'#F7F4EF'}}>{t.companies?.ticker||'?'}</div>
                    <div style={{fontSize:'13px',color:'#F7F4EF'}}>{t.insiders?.name||'Unknown'}</div>
                    <div style={{fontSize:'12px',color:'#DFC48B'}}>{t.insiders?.title||'—'}</div>
                    <div><span style={{background:isSell?'#2d1b1b':'#1B4332',border:'1px solid '+(isSell?'#c94c4c':'#C9A84C'),borderRadius:'100px',padding:'2px 8px',fontSize:'10px',fontWeight:700,color:isSell?'#c94c4c':'#C9A84C'}}>{t.transaction_type}</span></div>
                    <div style={{fontFamily:'monospace',fontSize:'13px',color:'#F7F4EF',fontWeight:600}}>{fv}</div>
                    <div style={{fontFamily:'monospace',fontSize:'12px',color:'#DFC48B'}}>{fmtDate(t.transaction_date)}</div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <div style={{marginTop:'32px',display:'flex',gap:'12px'}}>
          <button onClick={loadData} style={{background:'transparent',color:'#DFC48B',border:'1px solid #2D6A4F',padding:'10px 20px',borderRadius:'6px',fontSize:'13px',cursor:'pointer'}}>Refresh</button>
          <button onClick={()=>setAuthed(false)} style={{background:'transparent',color:'#2D6A4F',border:'1px solid #1B4332',padding:'10px 20px',borderRadius:'6px',fontSize:'13px',cursor:'pointer'}}>Lock</button>
        </div>
      </div>
    </main>
  )
}
