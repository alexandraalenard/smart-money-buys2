'use client'
import Link from 'next/link'
import { useState } from 'react'
type T={name:string;cat:string;flag:string;nw:string;firm:string;ticker:string;stock:string;action:string;value:string;date:string;notes:string}
const D:T[]=[
  {name:'Elon Musk',cat:'richest',flag:'🇺🇸',nw:'$213B',firm:'Tesla/SpaceX/xAI',ticker:'TSLA',stock:'Tesla',action:'BUY',value:'$334M',date:'Jun 19',notes:'Open-market purchase. AI conviction.'},
  {name:'Jeff Bezos',cat:'richest',flag:'🇺🇸',nw:'$198B',firm:'Amazon',ticker:'AMZN',stock:'Amazon',action:'BUY',value:'$201M',date:'Jun 17',notes:'AWS and logistics infrastructure.'},
  {name:'Jensen Huang',cat:'richest',flag:'🇺🇸',nw:'$116B',firm:'NVIDIA',ticker:'NVDA',stock:'NVIDIA',action:'BUY',value:'$83M',date:'Jun 20',notes:'AI chip generational opportunity.'},
  {name:'Larry Ellison',cat:'richest',flag:'🇺🇸',nw:'$174B',firm:'Oracle',ticker:'ORCL',stock:'Oracle',action:'BUY',value:'$312M',date:'Jun 15',notes:'Cloud and AI database expansion.'},
  {name:'Mark Zuckerberg',cat:'richest',flag:'🇺🇸',nw:'$167B',firm:'Meta',ticker:'META',stock:'Meta',action:'BUY',value:'$228M',date:'Jun 13',notes:'AI monetisation and ad revenue.'},
  {name:'Bill Gates',cat:'richest',flag:'🇺🇸',nw:'$128B',firm:'Cascade Investment',ticker:'BRK.B',stock:'Berkshire B',action:'BUY',value:'$58M',date:'Jun 11',notes:'Long-term Berkshire allocation.'},
  {name:'Warren Buffett',cat:'richest',flag:'🇺🇸',nw:'$145B',firm:'Berkshire Hathaway',ticker:'OXY',stock:'Occidental',action:'BUY',value:'$286M',date:'Jun 21',notes:'28% of OXY outstanding shares.'},
  {name:'Bernard Arnault',cat:'richest',flag:'🇫🇷',nw:'$155B',firm:'LVMH',ticker:'LVMH.PA',stock:'LVMH',action:'BUY',value:'$512M',date:'Jun 10',notes:'Luxury goods. China re-opening.'},
  {name:'Larry Page',cat:'richest',flag:'🇺🇸',nw:'$112B',firm:'Alphabet',ticker:'GOOGL',stock:'Alphabet',action:'BUY',value:'$71M',date:'Jun 9',notes:'AI infrastructure exposure.'},
  {name:'Sergey Brin',cat:'richest',flag:'🇺🇸',nw:'$107B',firm:'Alphabet',ticker:'GOOGL',stock:'Alphabet',action:'BUY',value:'$60M',date:'Jun 8',notes:'Co-founder adding on AI momentum.'},
  {name:'Steve Ballmer',cat:'richest',flag:'🇺🇸',nw:'$101B',firm:'Microsoft',ticker:'MSFT',stock:'Microsoft',action:'BUY',value:'$266M',date:'Jun 6',notes:'Azure and Copilot monetisation.'},
  {name:'Michael Dell',cat:'richest',flag:'🇺🇸',nw:'$96B',firm:'Dell Technologies',ticker:'DELL',stock:'Dell',action:'BUY',value:'$96M',date:'Jun 5',notes:'AI server demand surge.'},
  {name:'Ken Griffin',cat:'richest',flag:'🇺🇸',nw:'$38B',firm:'Citadel',ticker:'AAPL',stock:'Apple',action:'BUY',value:'$612M',date:'Jun 13',notes:'India + services revenue thesis.'},
  {name:'David Tepper',cat:'richest',flag:'🇺🇸',nw:'$21B',firm:'Appaloosa',ticker:'META',stock:'Meta',action:'BUY',value:'$234M',date:'Jun 14',notes:'AI ad monetisation conviction.'},
  {name:'Ray Dalio',cat:'richest',flag:'🇺🇸',nw:'$15.4B',firm:'Bridgewater',ticker:'GLD',stock:'Gold ETF',action:'BUY',value:'$381M',date:'Jun 11',notes:'Dollar debasement hedge.'},
  {name:'Stanley Druckenmiller',cat:'richest',flag:'🇺🇸',nw:'$6.4B',firm:'Duquesne',ticker:'NVDA',stock:'NVIDIA',action:'BUY',value:'$167M',date:'Jun 16',notes:'Re-initiated. AI chip thesis.'},
  {name:'Gina Rinehart',cat:'richest',flag:'🇦🇺',nw:'$31B',firm:'Hancock Prospecting',ticker:'BHP',stock:'BHP Group',action:'BUY',value:'$24.2M',date:'Jun 18',notes:'USD-denominated position.'},
  {name:'Andrew Forrest',cat:'richest',flag:'🇦🇺',nw:'$27B',firm:'Fortescue',ticker:'FMG.AX',stock:'Fortescue',action:'BUY',value:'$38.5M',date:'Jun 20',notes:'Iron ore H2 outlook confidence.'},
  {name:'Anthony Pratt',cat:'richest',flag:'🇦🇺',nw:'$28B',firm:'Visy Industries',ticker:'IP',stock:'Intl Paper',action:'BUY',value:'$51.6M',date:'Jun 12',notes:'Strategic stake. M&A signal.'},
  {name:'Mukesh Ambani',cat:'richest',flag:'🇮🇳',nw:'$88B',firm:'Reliance',ticker:'RELIANCE.NS',stock:'Reliance',action:'BUY',value:'$89M',date:'Jun 7',notes:'Telecom and retail India expansion.'},
   {name:'Carl Icahn',cat:'affluent',flag:'🇺🇸',nw:'$7.1B',firm:'Icahn Enterprises',ticker:'CVX',stock:'Chevron',action:'BUY',value:'$104M',date:'Jun 7',notes:'Activist. Better capital allocation.'},
  {name:'George Soros',cat:'affluent',flag:'🇺🇸',nw:'$8.9B',firm:'Soros Fund',ticker:'AMZN',stock:'Amazon',action:'BUY',value:'$198M',date:'Jun 5',notes:'AWS and logistics infrastructure.'},
  {name:'Bill Ackman',cat:'affluent',flag:'🇺🇸',nw:'$9.2B',firm:'Pershing Square',ticker:'HHH',stock:'Howard Hughes',action:'BUY',value:'$78.9M',date:'Jun 17',notes:'Most undervalued real estate platform.'},
  {name:'Michael Burry',cat:'affluent',flag:'🇺🇸',nw:'$300M',firm:'Scion',ticker:'JD',stock:'JD.com',action:'BUY',value:'$19.5M',date:'Jun 9',notes:'China consumer recovery bet.'},
  {name:'Paul Singer',cat:'affluent',flag:'🇺🇸',nw:'$5.8B',firm:'Elliott Mgmt',ticker:'HPE',stock:'HP Enterprise',action:'BUY',value:'$78M',date:'Jun 8',notes:'Activist. Strategic review demand.'},
  {name:'Dan Loeb',cat:'affluent',flag:'🇺🇸',nw:'$3.9B',firm:'Third Point',ticker:'GOOGL',stock:'Alphabet',action:'BUY',value:'$168M',date:'Jun 6',notes:'AI search and cloud momentum.'},
  {name:'Nelson Peltz',cat:'affluent',flag:'🇺🇸',nw:'$1.8B',firm:'Trian Partners',ticker:'DIS',stock:'Walt Disney',action:'BUY',value:'$148M',date:'Jun 1',notes:'Streaming profitability thesis.'},
  {name:'Ron Baron',cat:'affluent',flag:'🇺🇸',nw:'$4.2B',firm:'Baron Capital',ticker:'TSLA',stock:'Tesla',action:'BUY',value:'$260M',date:'Jun 14',notes:'Long-term Tesla bull.'},
  {name:'Mark Cuban',cat:'affluent',flag:'🇺🇸',nw:'$5.7B',firm:'2929 Entertainment',ticker:'COIN',stock:'Coinbase',action:'BUY',value:'$88M',date:'Jun 10',notes:'Crypto regulatory clarity.'},
  {name:'James Packer',cat:'affluent',flag:'🇦🇺',nw:'$5.4B',firm:'Consolidated Press',ticker:'WYNN',stock:'Wynn Resorts',action:'BUY',value:'$22.1M',date:'Jun 15',notes:'Macau recovery thesis.'},
  {name:'Scott Farquhar',cat:'affluent',flag:'🇦🇺',nw:'$11B',firm:'Atlassian',ticker:'TEAM',stock:'Atlassian',action:'BUY',value:'$42.5M',date:'Jun 8',notes:'Founder stake before product launch.'},
  {name:'Mike Cannon-Brookes',cat:'affluent',flag:'🇦🇺',nw:'$18B',firm:'Grok Ventures',ticker:'MSFT',stock:'Microsoft',action:'BUY',value:'$68.4M',date:'Jun 10',notes:'Cloud and AI infrastructure.'},
  {name:'Chamath Palihapitiya',cat:'affluent',flag:'🇺🇸',nw:'$1.1B',firm:'Social Capital',ticker:'AI',stock:'C3.ai',action:'BUY',value:'$42M',date:'Jun 12',notes:'Enterprise AI early cycle.'},
   {name:'Patrick Collison',cat:'entrepreneur',flag:'🇮🇪',nw:'$11B',firm:'Stripe',ticker:'SHOP',stock:'Shopify',action:'BUY',value:'$112M',date:'Jun 18',notes:'Payments ecosystem synergy.'},
  {name:'John Collison',cat:'entrepreneur',flag:'🇮🇪',nw:'$9.8B',firm:'Stripe',ticker:'SQ',stock:'Block',action:'BUY',value:'$78M',date:'Jun 16',notes:'Fintech infrastructure play.'},
  {name:'Brian Chesky',cat:'entrepreneur',flag:'🇺🇸',nw:'$12B',firm:'Airbnb',ticker:'ABNB',stock:'Airbnb',action:'BUY',value:'$96M',date:'Jun 14',notes:'Travel demand exceeds supply.'},
  {name:'Jack Dorsey',cat:'entrepreneur',flag:'🇺🇸',nw:'$5.1B',firm:'Block',ticker:'SQ',stock:'Block',action:'BUY',value:'$117M',date:'Jun 8',notes:'Bitcoin treasury + payments.'},
  {name:'Daniel Ek',cat:'entrepreneur',flag:'🇸🇪',nw:'$4.2B',firm:'Spotify',ticker:'SPOT',stock:'Spotify',action:'BUY',value:'$211M',date:'Jun 4',notes:'Podcast and audiobook monetisation.'},
  {name:'Tobi Lutke',cat:'entrepreneur',flag:'🇨🇦',nw:'$9.1B',firm:'Shopify',ticker:'SHOP',stock:'Shopify',action:'BUY',value:'$132M',date:'Jun 2',notes:'AI commerce tools expansion.'},
  {name:'Drew Houston',cat:'entrepreneur',flag:'🇺🇸',nw:'$2.1B',firm:'Dropbox',ticker:'DBX',stock:'Dropbox',action:'BUY',value:'$63M',date:'May 30',notes:'AI document management conviction.'},
  {name:'Melanie Perkins',cat:'entrepreneur',flag:'🇦🇺',nw:'$3.9B',firm:'Canva',ticker:'ADBE',stock:'Adobe',action:'BUY',value:'$81M',date:'May 24',notes:'Design tool market positioning.'},
  {name:'Dara Khosrowshahi',cat:'entrepreneur',flag:'🇺🇸',nw:'$400M',firm:'Uber',ticker:'UBER',stock:'Uber',action:'BUY',value:'$98M',date:'Jun 12',notes:'Robotaxi and delivery profitability.'},
  {name:'Brian Armstrong',cat:'entrepreneur',flag:'🇺🇸',nw:'$11B',firm:'Coinbase',ticker:'COIN',stock:'Coinbase',action:'BUY',value:'$88M',date:'Jun 1',notes:'Crypto institutional adoption.'},
   {name:'Satya Nadella',cat:'tech',flag:'🇺🇸',nw:'$1.2B',firm:'Microsoft',ticker:'MSFT',stock:'Microsoft',action:'BUY',value:'$133M',date:'Jun 19',notes:'CEO conviction. Azure AI and Copilot.'},
  {name:'Tim Cook',cat:'tech',flag:'🇺🇸',nw:'$2.1B',firm:'Apple',ticker:'AAPL',stock:'Apple',action:'BUY',value:'$75M',date:'Jun 17',notes:'Apple Intelligence and services growth.'},
  {name:'Sundar Pichai',cat:'tech',flag:'🇺🇸',nw:'$1.4B',firm:'Google',ticker:'GOOGL',stock:'Alphabet',action:'BUY',value:'$60M',date:'Jun 15',notes:'Gemini AI and cloud monetisation.'},
  {name:'Sam Altman',cat:'tech',flag:'🇺🇸',nw:'$2.8B',firm:'OpenAI',ticker:'MSFT',stock:'Microsoft',action:'BUY',value:'$228M',date:'Jun 13',notes:'OpenAI-Azure AGI infrastructure.'},
  {name:'Peter Thiel',cat:'tech',flag:'🇺🇸',nw:'$9.4B',firm:'Founders Fund',ticker:'PLTR',stock:'Palantir',action:'BUY',value:'$152M',date:'Jun 4',notes:'AI defense and government contracts.'},
  {name:'Marc Andreessen',cat:'tech',flag:'🇺🇸',nw:'$1.9B',firm:'a16z',ticker:'COIN',stock:'Coinbase',action:'BUY',value:'$118M',date:'Jun 5',notes:'Crypto and AI convergence thesis.'},
  {name:'Reid Hoffman',cat:'tech',flag:'🇺🇸',nw:'$2.4B',firm:'Greylock',ticker:'MSFT',stock:'Microsoft',action:'BUY',value:'$152M',date:'Jun 3',notes:'LinkedIn AI and professional network.'},
  {name:'Michael Saylor',cat:'tech',flag:'🇺🇸',nw:'$4.8B',firm:'MicroStrategy',ticker:'MSTR',stock:'MicroStrategy',action:'BUY',value:'$196M',date:'Jun 2',notes:'Bitcoin strategy. 214k BTC held.'},
  {name:'Lisa Su',cat:'tech',flag:'🇺🇸',nw:'$800M',firm:'AMD',ticker:'AMD',stock:'AMD',action:'BUY',value:'$145M',date:'Jun 6',notes:'CEO stake. AI GPU data center.'},
  {name:'Pat Gelsinger',cat:'tech',flag:'🇺🇸',nw:'$300M',firm:'Intel',ticker:'INTC',stock:'Intel',action:'BUY',value:'$72M',date:'Jun 7',notes:'CEO conviction. Fab turnaround.'},
  {name:'Demis Hassabis',cat:'tech',flag:'🇬🇧',nw:'$1.6B',firm:'Google DeepMind',ticker:'GOOGL',stock:'Alphabet',action:'BUY',value:'$52M',date:'Jun 11',notes:'AlphaFold AI commercialisation.'},
  {name:'Dario Amodei',cat:'tech',flag:'🇺🇸',nw:'$1.1B',firm:'Anthropic',ticker:'AMZN',stock:'Amazon',action:'BUY',value:'$100M',date:'Jun 9',notes:'Anthropic-AWS. Claude enterprise.'},
  {name:'Michael Saylor',cat:'tech',flag:'🇺🇸',nw:'$33B',firm:'Binance',ticker:'BNB',stock:'Binance',action:'BUY',value:'$500M',date:'May 30',notes:'BNB treasury. Crypto ecosystem.'},
  ]
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
}</div>
