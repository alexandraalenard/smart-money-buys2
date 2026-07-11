'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { supabase } from '../../lib/supabase'

interface Article {
  id: string
  headline: string
  summary: string | null
  source: string | null       // source domain, e.g. "reuters.com"
  url: string | null
  published_at: string | null
  tickers: string[]
}

function fmtDate(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function timeAgo(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  const secs = Math.floor((Date.now() - d.getTime()) / 1000)
  if (secs < 60) return 'just now'
  const mins = Math.floor(secs / 60)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

export default function MarketPulsePage() {
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        // 1. Most recent real headlines we've ingested from GDELT.
        const { data: news, error: nErr } = await supabase
          .from('news_articles')
          .select('id, headline, summary, source, url, published_at')
          .order('published_at', { ascending: false, nullsFirst: false })
          .limit(120)
        if (nErr) throw nErr

        const rows = news ?? []
        const ids = rows.map((r) => r.id)

        // 2. Which tickers each article was tagged to.
        const tickersByArticle: Record<string, string[]> = {}
        if (ids.length > 0) {
          const { data: impacts, error: iErr } = await supabase
            .from('article_stock_impacts')
            .select('article_id, ticker')
            .in('article_id', ids)
          if (iErr) throw iErr
          for (const imp of impacts ?? []) {
            if (!imp.article_id || !imp.ticker) continue
            ;(tickersByArticle[imp.article_id] ||= []).push(imp.ticker)
          }
        }

        if (cancelled) return
        setArticles(
          rows.map((r) => ({
            id: r.id,
            headline: r.headline,
            summary: r.summary ?? null,
            source: r.source ?? null,
            url: r.url ?? null,
            published_at: r.published_at ?? null,
            tickers: Array.from(new Set(tickersByArticle[r.id] || [])).sort(),
          }))
        )
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load market news')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [])

  const latestDate = articles.length ? fmtDate(articles[0].published_at) : null

  // Descriptive only: how many recent stories mention each tracked ticker.
  const topTickers = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const a of articles) for (const t of a.tickers) counts[t] = (counts[t] || 0) + 1
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 12)
  }, [articles])

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
              Live News · GDELT
            </div>
            <h1 style={{fontFamily:'Georgia, serif',fontSize:'48px',fontWeight:700,color:'#F7F4EF',marginBottom:'16px',lineHeight:1.1}}>
              Market Pulse
            </h1>
            <p style={{color:'#DFC48B',fontSize:'16px',maxWidth:'620px',lineHeight:1.7,margin:0}}>
              Recent news coverage of the companies we track, matched by name and tagged to their tickers.
              Headlines and links come straight from the publishers via the GDELT open news index — click through to read the original.
            </p>
          </div>
          <div style={{textAlign:'right'}}>
            <div style={{fontSize:'11px',letterSpacing:'0.1em',textTransform:'uppercase',color:'#C9A84C',marginBottom:'4px'}}>Latest Headline</div>
            <div style={{fontFamily:'monospace',fontSize:'16px',color:'#F7F4EF',fontWeight:700}}>{latestDate || '—'}</div>
            <div style={{fontSize:'12px',color:'#2D6A4F',marginTop:'4px'}}>{articles.length} stories loaded</div>
          </div>
        </div>
      </section>

      <section style={{maxWidth:'1280px',margin:'0 auto',padding:'56px 48px'}}>
        <div style={{display:'grid',gridTemplateColumns:'1fr 360px',gap:'48px',alignItems:'start'}}>

          {/* MAIN NEWS FEED */}
          <div style={{display:'flex',flexDirection:'column',gap:'20px'}}>
            {loading && (
              <div style={{color:'#9ca3af',fontFamily:'Georgia, serif',fontStyle:'italic',padding:'40px 0',textAlign:'center'}}>Loading news…</div>
            )}

            {!loading && error && (
              <div style={{padding:'24px',borderRadius:'10px',border:'1px solid rgba(201,168,76,0.2)',background:'#1B4332',color:'#DFC48B'}}>
                Could not load market news: {error}
              </div>
            )}

            {!loading && !error && articles.length === 0 && (
              <div style={{color:'#9ca3af',fontFamily:'Georgia, serif',fontStyle:'italic',padding:'56px 24px',textAlign:'center',border:'1px solid #2D6A4F',borderRadius:'10px',background:'#1B4332',lineHeight:1.7}}>
                No news has been ingested yet. Run the ingestion job (<span style={{fontFamily:'monospace',fontStyle:'normal',color:'#C9A84C'}}>/api/ingest-news</span>) to pull recent GDELT coverage for the tracked companies.
              </div>
            )}

            {!loading && !error && articles.map((item) => (
              <div key={item.id} style={{background:'#1B4332',border:'1px solid #2D6A4F',borderRadius:'10px',padding:'28px',position:'relative',overflow:'hidden'}}>
                <div style={{position:'absolute',top:0,left:0,right:0,height:'2px',background:'linear-gradient(90deg, #2D6A4F, #1B4332)'}} />

                <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:'12px',gap:'16px'}}>
                  <div style={{display:'flex',gap:'8px',alignItems:'center',flexWrap:'wrap'}}>
                    {item.tickers.map(t => (
                      <Link key={t} href={'/company/'+t} style={{fontFamily:'monospace',fontSize:'11px',fontWeight:700,color:'#C9A84C',background:'#2D6A4F',padding:'2px 8px',borderRadius:'4px',textDecoration:'none'}}>{t}</Link>
                    ))}
                    {item.source && (
                      <span style={{fontSize:'11px',color:'#DFC48B',letterSpacing:'0.04em'}}>{item.source}</span>
                    )}
                  </div>
                  <div style={{fontSize:'11px',color:'#2D6A4F',whiteSpace:'nowrap'}}>{timeAgo(item.published_at)}</div>
                </div>

                {item.url ? (
                  <a href={item.url} target="_blank" rel="noopener noreferrer" style={{textDecoration:'none'}}>
                    <h3 style={{fontFamily:'Georgia, serif',fontSize:'18px',fontWeight:700,color:'#F7F4EF',marginBottom:'10px',lineHeight:1.3}}>{item.headline}</h3>
                  </a>
                ) : (
                  <h3 style={{fontFamily:'Georgia, serif',fontSize:'18px',fontWeight:700,color:'#F7F4EF',marginBottom:'10px',lineHeight:1.3}}>{item.headline}</h3>
                )}

                {item.summary && (
                  <div style={{background:'#07130E',border:'1px solid rgba(201,168,76,0.25)',borderRadius:'6px',padding:'12px 16px',marginBottom:'12px'}}>
                    <div style={{fontSize:'10px',letterSpacing:'0.1em',textTransform:'uppercase',color:'#C9A84C',fontWeight:700,marginBottom:'6px'}}>AI Summary</div>
                    <p style={{fontSize:'13px',color:'#DFC48B',lineHeight:1.6,margin:0}}>{item.summary}</p>
                  </div>
                )}

                <div style={{display:'flex',alignItems:'center',gap:'14px',flexWrap:'wrap'}}>
                  <span style={{fontSize:'12px',color:'#2D6A4F'}}>{fmtDate(item.published_at)}</span>
                  {item.url && (
                    <a href={item.url} target="_blank" rel="noopener noreferrer" style={{fontSize:'12px',color:'#C9A84C',textDecoration:'none',fontWeight:600}}>Read original ↗</a>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* SIDEBAR */}
          <div style={{display:'flex',flexDirection:'column',gap:'20px'}}>
            <div style={{background:'#1B4332',border:'1px solid #2D6A4F',borderRadius:'10px',padding:'24px',position:'sticky',top:'80px'}}>
              <div style={{fontSize:'11px',letterSpacing:'0.12em',textTransform:'uppercase',color:'#C9A84C',marginBottom:'16px',fontWeight:600}}>Most-Mentioned Tickers</div>
              {topTickers.length === 0 && (
                <div style={{fontSize:'13px',color:'#DFC48B',lineHeight:1.6}}>No coverage loaded yet.</div>
              )}
              {topTickers.map(([ticker, count]) => (
                <Link key={ticker} href={'/company/'+ticker} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 0',borderBottom:'1px solid #2D6A4F',textDecoration:'none'}}>
                  <span style={{fontFamily:'monospace',fontSize:'13px',fontWeight:700,color:'#F7F4EF'}}>{ticker}</span>
                  <span style={{fontFamily:'monospace',fontSize:'12px',color:'#C9A84C'}}>{count} {count === 1 ? 'story' : 'stories'}</span>
                </Link>
              ))}

              <div style={{marginTop:'20px',paddingTop:'16px',borderTop:'1px solid #2D6A4F'}}>
                <div style={{fontSize:'11px',letterSpacing:'0.12em',textTransform:'uppercase',color:'#C9A84C',marginBottom:'8px',fontWeight:600}}>About This Feed</div>
                <p style={{fontSize:'12px',color:'#DFC48B',lineHeight:1.7,margin:0}}>
                  Coverage is discovered via the{' '}
                  <a href="https://www.gdeltproject.org/" target="_blank" rel="noopener noreferrer" style={{color:'#C9A84C',textDecoration:'none'}}>GDELT Project</a>{' '}
                  open news index. Articles are matched to a company by name, so an occasional headline may be tangential. Nothing here is a price forecast.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer style={{padding:'32px 48px',borderTop:'1px solid #1B4332'}}>
        <div style={{maxWidth:'1280px',margin:'0 auto'}}>
          <p style={{fontSize:'11px',color:'#2D6A4F',lineHeight:1.7,margin:0}}>
            News discovery powered by the GDELT Project (gdeltproject.org). Headlines, links, and publication details belong to their original publishers; follow each link to read the full article at its source. This page reproduces headlines and metadata only and makes no prediction about any stock&apos;s future price. Not financial advice. © 2026 The Hidden Ledger.
          </p>
        </div>
      </footer>
    </main>
  )
}
