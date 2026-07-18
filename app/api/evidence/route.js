import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Evidence panel data for a single stock.
//
// This route answers ONE honest question: "how much documented evidence is
// there about this company right now, and what does it say?" It counts real
// records — SEC Form 4 insider filings and ingested news coverage — and returns
// them plus a plain description of how much evidence exists. It does NOT predict
// price, score the stock, or invent sentiment. Read-only.

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 30

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const NEWS_WINDOW_DAYS = 21
const INSIDER_WINDOW_DAYS = 120

// Dollar value of a transaction, preferring the pre-computed total.
function txValue(t) {
  if (t.total_value != null && !Number.isNaN(Number(t.total_value))) return Number(t.total_value)
  const shares = Number(t.shares) || 0
  const price = Number(t.price_per_share ?? t.price) || 0
  return shares * price
}

// Classify a Form 4 transaction honestly by its SEC transaction code:
//   P = open-market PURCHASE (real conviction — own money in)
//   S = open-market SALE
//   A = grant/award (compensation, NOT a purchase)
//   M = option exercise
// Fall back to the acquired/disposed flag, then the denormalized type strings.
function classify(t) {
  const code = String(t.transaction_code || '').toUpperCase()
  if (code === 'P') return 'purchase'
  if (code === 'S') return 'sale'
  if (code === 'A') return 'award'
  if (code === 'M') return 'exercise'
  const ad = String(t.acquired_disposed_code || '').toUpperCase()
  if (ad === 'A') return 'acquired_other'
  if (ad === 'D') return 'sale'
  const ty = String(t.transaction_type || t.trade_type || '').toUpperCase()
  if (ty.includes('BUY') || ty === 'P') return 'purchase'
  if (ty.includes('SELL') || ty === 'S') return 'sale'
  return 'other'
}

// Turn raw counts into a plain-language description of how MUCH evidence exists.
// Deliberately a description of evidence volume, NOT a rating of the stock.
function evidenceDensity({ distinctOutlets, purchaseCount, saleCount, form4Count }) {
  const insiderActivity = purchaseCount + saleCount
  const signals = distinctOutlets + insiderActivity
  if (signals === 0 && form4Count === 0) return 'None'
  if (signals <= 2) return 'Thin'
  if (signals <= 6) return 'Moderate'
  return 'Substantial'
}

export async function GET(request) {
  try {
    const url = new URL(request.url)
    const ticker = String(url.searchParams.get('ticker') || '').trim().toUpperCase()
    if (!ticker) return NextResponse.json({ error: 'ticker is required' }, { status: 400 })

    const now = Date.now()
    const newsSince = new Date(now - NEWS_WINDOW_DAYS * 86400000).toISOString()
    const insiderSince = new Date(now - INSIDER_WINDOW_DAYS * 86400000).toISOString().slice(0, 10)

    // --- Company --------------------------------------------------------
    const { data: company, error: cErr } = await supabase
      .from('companies')
      .select('id, ticker, name, sector')
      .eq('ticker', ticker)
      .single()
    if (cErr || !company) {
      return NextResponse.json({ error: `No company found for ${ticker}` }, { status: 404 })
    }

    // --- News evidence: articles tagged to this ticker ------------------
    const { data: impacts } = await supabase
      .from('article_stock_impacts')
      .select('article_id')
      .eq('ticker', ticker)
    const articleIds = [...new Set((impacts || []).map((i) => i.article_id).filter(Boolean))]

    let newsArticles = []
    if (articleIds.length > 0) {
      const { data: articles } = await supabase
        .from('news_articles')
        .select('id, headline, summary, source, url, published_at')
        .in('id', articleIds)
        .gte('published_at', newsSince)
        .order('published_at', { ascending: false, nullsFirst: false })
        .limit(30)
      newsArticles = articles || []
    }
    const distinctOutlets = [...new Set(newsArticles.map((a) => (a.source || '').trim()).filter(Boolean))]
    const latestNewsDate = newsArticles.length ? newsArticles[0].published_at : null

    // --- Insider evidence: Form 4 filings for this company --------------
    const { data: txns } = await supabase
      .from('insider_transactions')
      .select('id, transaction_date, trade_date, transaction_code, transaction_type, trade_type, acquired_disposed_code, shares, price_per_share, price, total_value, insider_name, insider_title, form4_url')
      .eq('company_id', company.id)
      .gte('transaction_date', insiderSince)
      .order('transaction_date', { ascending: false })
      .limit(60)

    const tx = txns || []
    let purchaseCount = 0, saleCount = 0, awardCount = 0, exerciseCount = 0
    let purchaseValue = 0, saleValue = 0
    const distinctInsiders = new Set()
    const recentInsider = []
    for (const t of tx) {
      const kind = classify(t)
      const value = txValue(t)
      if (t.insider_name) distinctInsiders.add(t.insider_name)
      if (kind === 'purchase') { purchaseCount++; purchaseValue += value }
      else if (kind === 'sale') { saleCount++; saleValue += value }
      else if (kind === 'award') awardCount++
      else if (kind === 'exercise') exerciseCount++
      if (recentInsider.length < 15) {
        recentInsider.push({
          insider: t.insider_name || 'Unknown',
          title: t.insider_title || null,
          kind,
          value,
          date: t.transaction_date || t.trade_date || null,
          form4_url: t.form4_url || null,
        })
      }
    }

    const density = evidenceDensity({
      distinctOutlets: distinctOutlets.length,
      purchaseCount,
      saleCount,
      form4Count: tx.length,
    })

    return NextResponse.json({
      ticker,
      company: { name: company.name, sector: company.sector },
      generated_at: new Date(now).toISOString(),
      evidence_density: density, // None | Thin | Moderate | Substantial (volume, NOT a buy rating)
      news: {
        window_days: NEWS_WINDOW_DAYS,
        article_count: newsArticles.length,
        distinct_outlets: distinctOutlets.length,
        latest_published_at: latestNewsDate,
        // outlets covering a story overlap heavily; breadth is NOT independent confirmation
        articles: newsArticles.map((a) => ({
          headline: a.headline,
          source: a.source || null,
          url: a.url || null,
          published_at: a.published_at || null,
          summary: a.summary || null,
        })),
      },
      insider: {
        window_days: INSIDER_WINDOW_DAYS,
        form4_count: tx.length,
        distinct_insiders: distinctInsiders.size,
        purchase_count: purchaseCount,
        sale_count: saleCount,
        award_count: awardCount,        // grants/compensation, not conviction
        exercise_count: exerciseCount,  // option exercises, not open-market buys
        purchase_value: Math.round(purchaseValue),
        sale_value: Math.round(saleValue),
        recent: recentInsider,
      },
    })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
