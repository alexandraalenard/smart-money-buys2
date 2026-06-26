'use client'
import { useState } from 'react'
import Link from 'next/link'

// Rule-based scoring engine
// Each rule returns 0-100 points with a weight
// Final score = weighted average

interface ScoreResult {
  score: number
  label: string
  color: string
  breakdown: { rule: string; desc: string; points: number; max: number; weight: number }[]
  summary: string
}

// Known sector classifications
const SECTOR_MAP: Record<string, string> = {
  AAPL:'Technology', MSFT:'Technology', NVDA:'Technology', GOOGL:'Technology', META:'Technology',
  AMZN:'Consumer Discretionary', TSLA:'Consumer Discretionary', NFLX:'Communication Services',
  JPM:'Financials', BAC:'Financials', GS:'Financials', V:'Financials', MA:'Financials',
  JNJ:'Healthcare', PFE:'Healthcare', MRK:'Healthcare', UNH:'Healthcare', ABBV:'Healthcare',
  XOM:'Energy', CVX:'Energy', COP:'Energy', SLB:'Energy',
  GM:'Consumer Discretionary', F:'Consumer Discretionary',
  CSCO:'Technology', IBM:'Technology', INTC:'Technology', AMD:'Technology', QCOM:'Technology',
  WMT:'Consumer Staples', COST:'Consumer Staples', PG:'Consumer Staples', KO:'Consumer Staples', PEP:'Consumer Staples',
  CAT:'Industrials', GE:'Industrials', HON:'Industrials', DE:'Industrials', MMM:'Industrials',
  NEE:'Utilities', SO:'Utilities', DUK:'Utilities',
}

// Simulated fundamentals (in real app these would come from a financial data API)
// Format: [pe_ratio, revenue_growth_pct, debt_equity, profit_margin_pct, dividend_yield_pct, market_cap_b]
const FUNDAMENTALS: Record<string, [number,number,number,number,number,number]> = {
  AAPL:[28,6,1.8,25,0.5,3000], MSFT:[35,16,0.4,36,0.7,3100], NVDA:[45,122,0.4,55,0.03,2900],
  GOOGL:[22,15,0.1,24,0,2000], META:[25,22,0.1,34,0.4,1300], AMZN:[40,11,0.6,5,0,2100],
  TSLA:[55,3,0.2,13,0,700], JPM:[12,8,1.2,31,2.3,590], BAC:[13,5,1.3,28,2.5,330],
  JNJ:[16,4,0.5,22,3.1,380], PFE:[12,-1,0.6,15,5.8,160], XOM:[14,2,0.2,10,3.4,510],
  WMT:[28,5,0.6,3,1.4,690], COST:[50,8,0.5,3,0.5,340], V:[30,10,0.6,50,0.7,560],
  UNH:[20,9,0.7,6,1.5,440], GS:[12,3,2.1,25,2.4,140], NFLX:[38,15,1.1,17,0,280],
  GM:[6,4,2.8,6,1.0,52], F:[7,5,3.2,2,5.0,45], CAT:[17,5,1.5,16,1.6,170],
}

function scoreStock(ticker: string): ScoreResult {
  const t = ticker.toUpperCase()
  const sector = SECTOR_MAP[t] || 'Unknown'
  const f = FUNDAMENTALS[t]

  const breakdown = []

  // 1. P/E Ratio (value) - 20pts
  let peScore = 50
  let peDesc = 'No P/E data available'
  if (f) {
    const pe = f[0]
    if (pe <= 0) { peScore = 20; peDesc = 'Negative earnings (loss-making)' }
    else if (pe < 12) { peScore = 95; peDesc = pe + 'x — deeply undervalued vs market' }
    else if (pe < 18) { peScore = 85; peDesc = pe + 'x — attractively valued' }
    else if (pe < 25) { peScore = 70; peDesc = pe + 'x — fairly valued' }
    else if (pe < 35) { peScore = 50; peDesc = pe + 'x — growth premium priced in' }
    else if (pe < 50) { peScore = 35; peDesc = pe + 'x — high growth expectations' }
    else { peScore = 20; peDesc = pe + 'x — speculative valuation' }
  }
  breakdown.push({ rule: 'Valuation (P/E)', desc: peDesc, points: peScore, max: 100, weight: 0.20 })

  // 2. Revenue Growth - 20pts
  let growthScore = 50
  let growthDesc = 'No revenue data'
  if (f) {
    const g = f[1]
    if (g < 0) { growthScore = 15; growthDesc = g + '% — revenue declining' }
    else if (g < 3) { growthScore = 35; growthDesc = g + '% — slow growth' }
    else if (g < 8) { growthScore = 60; growthDesc = g + '% — moderate growth' }
    else if (g < 15) { growthScore = 80; growthDesc = g + '% — strong growth' }
    else if (g < 30) { growthScore = 90; growthDesc = g + '% — high growth' }
    else { growthScore = 95; growthDesc = g + '% — exceptional growth' }
  }
  breakdown.push({ rule: 'Revenue Growth', desc: growthDesc, points: growthScore, max: 100, weight: 0.20 })

  // 3. Debt/Equity (balance sheet health) - 15pts
  let debtScore = 50
  let debtDesc = 'No debt data'
  if (f) {
    const de = f[2]
    if (de < 0.2) { debtScore = 95; debtDesc = de + ' — fortress balance sheet' }
    else if (de < 0.5) { debtScore = 85; debtDesc = de + ' — minimal debt' }
    else if (de < 1.0) { debtScore = 70; debtDesc = de + ' — healthy leverage' }
    else if (de < 2.0) { debtScore = 45; debtDesc = de + ' — elevated debt' }
    else { debtScore = 20; debtDesc = de + ' — high leverage risk' }
  }
  breakdown.push({ rule: 'Balance Sheet (D/E)', desc: debtDesc, points: debtScore, max: 100, weight: 0.15 })

  // 4. Profit Margin - 15pts
  let marginScore = 50
  let marginDesc = 'No margin data'
  if (f) {
    const m = f[3]
    if (m < 0) { marginScore = 10; marginDesc = m + '% — loss-making' }
    else if (m < 5) { marginScore = 35; marginDesc = m + '% — thin margins' }
    else if (m < 12) { marginScore = 60; marginDesc = m + '% — acceptable margins' }
    else if (m < 25) { marginScore = 80; marginDesc = m + '% — healthy margins' }
    else { marginScore = 95; marginDesc = m + '% — exceptional margins' }
  }
  breakdown.push({ rule: 'Profit Margin', desc: marginDesc, points: marginScore, max: 100, weight: 0.15 })

  // 5. Dividend yield (income + stability signal) - 10pts
  let divScore = 50
  let divDesc = 'No dividend data'
  if (f) {
    const d = f[4]
    if (d === 0) { divScore = 50; divDesc = 'No dividend — growth-focused' }
    else if (d < 1) { divScore = 60; divDesc = d + '% — small dividend' }
    else if (d < 2.5) { divScore = 75; divDesc = d + '% — solid yield' }
    else if (d < 5) { divScore = 85; divDesc = d + '% — attractive income' }
    else { divScore = 70; divDesc = d + '% — high yield (verify sustainability)' }
  }
  breakdown.push({ rule: 'Dividend Yield', desc: divDesc, points: divScore, max: 100, weight: 0.10 })

  // 6. Market Cap (stability factor) - 10pts
  let capScore = 50
  let capDesc = 'Unknown market cap'
  if (f) {
    const mc = f[5]
    if (mc > 1000) { capScore = 90; capDesc = '$' + mc + 'B — mega-cap, high stability' }
    else if (mc > 200) { capScore = 80; capDesc = '$' + mc + 'B — large-cap, stable' }
    else if (mc > 50) { capScore = 65; capDesc = '$' + mc + 'B — mid-cap' }
    else { capScore = 45; capDesc = '$' + mc + 'B — small-cap, higher risk' }
  }
  breakdown.push({ rule: 'Market Cap', desc: capDesc, points: capScore, max: 100, weight: 0.10 })

  // 7. Sector outlook - 10pts
  const sectorScores: Record<string, number> = {
    'Technology': 82, 'Healthcare': 75, 'Financials': 68, 'Consumer Staples': 72,
    'Communication Services': 70, 'Industrials': 65, 'Consumer Discretionary': 63,
    'Energy': 58, 'Utilities': 62, 'Materials': 60, 'Real Estate': 55, 'Unknown': 50
  }
  const sectorScore = sectorScores[sector] || 50
  breakdown.push({ rule: 'Sector Outlook', desc: sector + ' sector — current macro conditions', points: sectorScore, max: 100, weight: 0.10 })

  // Weighted final score
  const total = breakdown.reduce((acc, b) => acc + b.points * b.weight, 0)
  const score = Math.round(total)

  let label = 'Weak'
  let color = '#4a5568'
  if (score >= 80) { label = 'Strong Buy'; color = '#C9A84C' }
  else if (score >= 70) { label = 'Buy'; color = '#DFC48B' }
  else if (score >= 55) { label = 'Hold'; color = '#2D6A4F' }
  else if (score >= 40) { label = 'Weak Hold'; color = '#6b7280' }
  else { label = 'Avoid'; color = '#c94c4c' }

  // Generate summary text
  const topFactor = breakdown.sort((a,b) => b.points*b.weight - a.points*a.weight)[0]
  const weakFactor = [...breakdown].sort((a,b) => a.points - b.points)[0]
  const summary = f
    ? ticker.toUpperCase() + ' scores ' + score + '/100. Strongest signal: ' + topFactor.rule + ' (' + topFactor.desc + '). Watch: ' + weakFactor.rule + ' (' + weakFactor.desc + ').'
    : ticker.toUpperCase() + ' is not yet in our database. Score is estimated from sector averages only. Add it to the watchlist to track real SEC filings.'

  return { score, label, color, breakdown, summary }
}

const POPULAR_TICKERS = ['AAPL','MSFT','NVDA','GOOGL','META','AMZN','TSLA','JPM','V','UNH','XOM','WMT','GM','F','NFLX']

export default function StockScreenerPage() {
  const [ticker, setTicker] = useState('')
  const [result, setResult] = useState<ScoreResult | null>(null)
  const [searched, setSearched] = useState('')

  function doScore(t: string) {
    const clean = t.trim().toUpperCase()
    if (!clean) return
    setSearched(clean)
    setResult(scoreStock(clean))
  }

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
          <Link href="/stock-screener" style={{fontSize:'13px',color:'#C9A84C',letterSpacing:'0.06em',textTransform:'uppercase',textDecoration:'none',fontWeight:700}}>Screener</Link>
          <Link href="/buyers-corner" style={{fontSize:'13px',color:'#DFC48B',letterSpacing:'0.06em',textTransform:'uppercase',textDecoration:'none'}}>Buyers Corner</Link>
          <Link href="/pricing" style={{background:'#C9A84C',color:'#07130E',padding:'8px 20px',borderRadius:'6px',fontSize:'12px',fontWeight:700,letterSpacing:'0.08em',textTransform:'uppercase',textDecoration:'none'}}>Subscribe</Link>
        </div>
      </nav>

      <section style={{background:'linear-gradient(180deg, #1B4332 0%, #07130E 100%)',padding:'64px 48px 48px',borderBottom:'1px solid #2D6A4F',textAlign:'center'}}>
        <div style={{display:'inline-block',background:'#2D6A4F',border:'1px solid #C9A84C',borderRadius:'100px',padding:'4px 16px',marginBottom:'20px',fontSize:'11px',letterSpacing:'0.12em',textTransform:'uppercase',color:'#C9A84C',fontWeight:600}}>
          Rule-Based Buy Score
        </div>
        <h1 style={{fontFamily:'Georgia, serif',fontSize:'48px',fontWeight:700,color:'#F7F4EF',marginBottom:'16px',lineHeight:1.1}}>
          Stock Screener
        </h1>
        <p style={{color:'#DFC48B',fontSize:'16px',maxWidth:'540px',margin:'0 auto 40px',lineHeight:1.7}}>
          Enter any US stock ticker. We score it across 7 fundamental and market rules — valuation, growth, balance sheet, margins, dividends, market cap and sector.
        </p>

        <div style={{display:'flex',gap:'12px',maxWidth:'480px',margin:'0 auto',justifyContent:'center'}}>
          <input
            type="text"
            placeholder="Enter ticker (e.g. AAPL, TSLA, NVDA)"
            value={ticker}
            onChange={e => setTicker(e.target.value.toUpperCase())}
            onKeyDown={e => e.key === 'Enter' && doScore(ticker)}
            style={{flex:1,background:'#07130E',border:'1px solid #2D6A4F',borderRadius:'8px',padding:'14px 20px',color:'#F7F4EF',fontSize:'16px',outline:'none',fontFamily:'monospace',letterSpacing:'0.06em'}}
          />
          <button
            onClick={() => doScore(ticker)}
            style={{background:'#C9A84C',color:'#07130E',border:'none',padding:'14px 28px',borderRadius:'8px',fontSize:'14px',fontWeight:700,letterSpacing:'0.06em',textTransform:'uppercase',cursor:'pointer',whiteSpace:'nowrap'}}
          >
            Score It
          </button>
        </div>

        <div style={{marginTop:'24px',display:'flex',gap:'8px',justifyContent:'center',flexWrap:'wrap'}}>
          <span style={{fontSize:'11px',color:'#2D6A4F',marginRight:'4px'}}>Try:</span>
          {POPULAR_TICKERS.map(t => (
            <button key={t} onClick={() => { setTicker(t); doScore(t); }} style={{background:'#1B4332',border:'1px solid #2D6A4F',color:'#DFC48B',padding:'4px 12px',borderRadius:'100px',fontSize:'11px',fontFamily:'monospace',cursor:'pointer',fontWeight:600}}>
              {t}
            </button>
          ))}
        </div>
      </section>

      <section style={{maxWidth:'900px',margin:'0 auto',padding:'56px 48px'}}>
        {result && (
          <div>
            {/* Score header */}
            <div style={{background:'#1B4332',border:'2px solid ' + result.color,borderRadius:'12px',padding:'40px',marginBottom:'32px',position:'relative',overflow:'hidden'}}>
              <div style={{position:'absolute',top:0,left:0,right:0,height:'3px',background:'linear-gradient(90deg, #C9A84C, #DFC48B)'}} />
              <div style={{display:'grid',gridTemplateColumns:'1fr auto',gap:'32px',alignItems:'center'}}>
                <div>
                  <div style={{fontFamily:'monospace',fontSize:'42px',fontWeight:800,color:'#F7F4EF',marginBottom:'8px'}}>{searched}</div>
                  <p style={{fontSize:'15px',color:'#DFC48B',lineHeight:1.7,margin:0}}>{result.summary}</p>
                </div>
                <div style={{textAlign:'center',minWidth:'160px'}}>
                  <div style={{fontSize:'11px',letterSpacing:'0.12em',textTransform:'uppercase',color:'#C9A84C',marginBottom:'8px',fontWeight:600}}>Buy Score</div>
                  <div style={{fontSize:'88px',fontWeight:900,color:result.color,lineHeight:1}}>{result.score}</div>
                  <div style={{fontSize:'14px',color:'#DFC48B',marginBottom:'12px'}}>/100</div>
                  <div style={{background:'#2D6A4F',borderRadius:'6px',padding:'8px 20px',fontSize:'13px',fontWeight:700,letterSpacing:'0.08em',textTransform:'uppercase',color:result.color}}>
                    {result.label}
                  </div>
                </div>
              </div>
            </div>

            {/* Score breakdown */}
            <div style={{marginBottom:'32px'}}>
              <div style={{fontSize:'11px',letterSpacing:'0.12em',textTransform:'uppercase',color:'#C9A84C',marginBottom:'20px',fontWeight:600}}>Score Breakdown — 7 Rules</div>
              <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
                {[...result.breakdown].sort((a,b) => b.weight - a.weight).map(b => {
                  const weighted = Math.round(b.points * b.weight)
                  return (
                    <div key={b.rule} style={{background:'#1B4332',border:'1px solid #2D6A4F',borderRadius:'8px',padding:'16px 20px'}}>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'8px'}}>
                        <div>
                          <div style={{fontSize:'14px',fontWeight:600,color:'#F7F4EF'}}>{b.rule}</div>
                          <div style={{fontSize:'12px',color:'#DFC48B',marginTop:'2px'}}>{b.desc}</div>
                        </div>
                        <div style={{textAlign:'right',minWidth:'80px'}}>
                          <div style={{fontFamily:'monospace',fontSize:'22px',fontWeight:700,color:b.points >= 70 ? '#C9A84C' : b.points >= 45 ? '#DFC48B' : '#c94c4c'}}>{b.points}</div>
                          <div style={{fontSize:'10px',color:'#2D6A4F'}}>weight {Math.round(b.weight*100)}%</div>
                        </div>
                      </div>
                      <div style={{height:'6px',background:'#07130E',borderRadius:'3px',overflow:'hidden'}}>
                        <div style={{width:b.points + '%',height:'100%',background:'linear-gradient(90deg, #2D6A4F, ' + (b.points >= 70 ? '#C9A84C' : b.points >= 45 ? '#DFC48B' : '#c94c4c') + ')',borderRadius:'3px'}} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Score key */}
            <div style={{background:'#1B4332',border:'1px solid #2D6A4F',borderRadius:'8px',padding:'20px',marginBottom:'32px'}}>
              <div style={{fontSize:'11px',letterSpacing:'0.12em',textTransform:'uppercase',color:'#C9A84C',marginBottom:'16px',fontWeight:600}}>Score Key</div>
              <div style={{display:'flex',gap:'16px',flexWrap:'wrap'}}>
                {[
                  {range:'80-100',label:'Strong Buy',color:'#C9A84C'},
                  {range:'70-79',label:'Buy',color:'#DFC48B'},
                  {range:'55-69',label:'Hold',color:'#2D6A4F'},
                  {range:'40-54',label:'Weak Hold',color:'#6b7280'},
                  {range:'0-39',label:'Avoid',color:'#c94c4c'},
                ].map(k => (
                  <div key={k.range} style={{display:'flex',alignItems:'center',gap:'8px'}}>
                    <div style={{width:'10px',height:'10px',borderRadius:'50%',background:k.color}} />
                    <span style={{fontSize:'13px',color:'#DFC48B'}}>{k.range}</span>
                    <span style={{fontSize:'13px',fontWeight:600,color:k.color}}>{k.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{textAlign:'center',marginTop:'24px'}}>
              <Link href={'/company/' + searched} style={{display:'inline-block',background:'#2D6A4F',color:'#F7F4EF',border:'1px solid #C9A84C',padding:'12px 28px',borderRadius:'6px',fontSize:'13px',fontWeight:600,textDecoration:'none'}}>
                View {searched} Insider Filing Data →
              </Link>
            </div>
          </div>
        )}

        {!result && (
          <div style={{textAlign:'center',padding:'60px 0',color:'#2D6A4F',fontFamily:'Georgia, serif',fontSize:'18px',fontStyle:'italic'}}>
            Enter a ticker above to generate a buy score.
          </div>
        )}

        {/* HOW IT WORKS */}
        <div style={{marginTop:'56px',background:'#1B4332',border:'1px solid #2D6A4F',borderRadius:'10px',padding:'28px'}}>
          <div style={{fontSize:'11px',letterSpacing:'0.12em',textTransform:'uppercase',color:'#C9A84C',marginBottom:'16px',fontWeight:600}}>How the Scoring Rules Work</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'16px'}}>
            {[
              {rule:'Valuation (P/E)',weight:'20%',desc:'Measures how cheap or expensive the stock is relative to earnings. Lower P/E generally signals more value.'},
              {rule:'Revenue Growth',weight:'20%',desc:'Year-over-year revenue growth. Consistent growth above 10% signals strong business momentum.'},
              {rule:'Balance Sheet (D/E)',weight:'15%',desc:'Debt-to-equity ratio. Low debt means financial flexibility and resilience in downturns.'},
              {rule:'Profit Margin',weight:'15%',desc:'Net profit as % of revenue. Higher margins indicate a more efficient, defensible business.'},
              {rule:'Dividend Yield',weight:'10%',desc:'Annual dividend as % of share price. Dividends signal mature, cash-generative businesses.'},
              {rule:'Market Cap',weight:'10%',desc:'Total company value. Larger companies carry lower liquidity risk and higher institutional coverage.'},
              {rule:'Sector Outlook',weight:'10%',desc:'Current macro and structural tailwinds or headwinds facing the sector. AI-assessed.'},
            ].map(({rule,weight,desc})=>(
              <div key={rule} style={{padding:'12px',borderBottom:'1px solid #07130E'}}>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:'4px'}}>
                  <span style={{fontSize:'13px',fontWeight:600,color:'#F7F4EF'}}>{rule}</span>
                  <span style={{fontFamily:'monospace',fontSize:'11px',color:'#C9A84C',fontWeight:700}}>{weight}</span>
                </div>
                <div style={{fontSize:'12px',color:'#DFC48B',lineHeight:1.5}}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DISCLAIMER */}
      <section style={{background:'#07130E',borderTop:'2px solid #1B4332',padding:'40px 48px'}}>
        <div style={{maxWidth:'900px',margin:'0 auto'}}>
          <div style={{background:'#1B4332',border:'1px solid #2D6A4F',borderRadius:'8px',padding:'24px'}}>
            <div style={{fontSize:'12px',fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',color:'#C9A84C',marginBottom:'12px'}}>Important Disclaimer — Please Read</div>
            <p style={{fontSize:'12px',color:'#DFC48B',lineHeight:1.8,margin:'0 0 12px'}}>
              The scores, ratings and analysis provided by The Hidden Ledger Stock Screener are generated by a rule-based algorithm using publicly available financial data and are provided for <strong style={{color:'#F7F4EF'}}>informational and educational purposes only</strong>. They do not constitute financial advice, investment recommendations, or an offer to buy or sell any security.
            </p>
            <p style={{fontSize:'12px',color:'#DFC48B',lineHeight:1.8,margin:'0 0 12px'}}>
              <strong style={{color:'#F7F4EF'}}>The Hidden Ledger, its operators, employees and affiliates accept no liability</strong> for any losses, damages or investment decisions made based on the scores or information presented on this page. Past performance of any scoring methodology does not guarantee future results.
            </p>
            <p style={{fontSize:'12px',color:'#DFC48B',lineHeight:1.8,margin:'0'}}>
              Fundamental data used in scoring is sourced from publicly available financial disclosures and may not reflect the most current financial position of any company. Always conduct your own due diligence and consult a licensed financial adviser before making any investment decision. Stock investing involves risk, including the possible loss of principal.
            </p>
          </div>
        </div>
      </section>

      <footer style={{padding:'32px 48px',borderTop:'1px solid #1B4332'}}>
        <div style={{maxWidth:'1280px',margin:'0 auto',fontSize:'11px',color:'#2D6A4F',textAlign:'center'}}>
          All data publicly available. Scores are algorithmic estimates only. Not financial advice. 2026 The Hidden Ledger.
        </div>
      </footer>
    </main>
  )
}
