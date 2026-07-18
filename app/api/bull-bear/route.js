import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Bull-case / Bear-case for a single stock.
//
// HONESTY CONTRACT (this is the whole point):
// * The model is given ONLY the real news + Form 4 facts we already hold for
//   this ticker, and is told to surface the strongest argument each way that is
//   SUPPORTED BY THOSE SOURCES — nothing else.
// * It is explicitly forbidden from predicting the price, saying whether to buy
//   or sell, or inventing facts not in the sources.
// * If the evidence is thin or one-sided, it must say so (a side can be empty).
// The output is "here are the arguments, with their sources" — you decide.

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 45

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-5'
const NEWS_WINDOW_DAYS = 21
const INSIDER_WINDOW_DAYS = 120

function classify(t) {
  const code = String(t.transaction_code || '').toUpperCase()
  if (code === 'P') return 'open-market purchase'
  if (code === 'S') return 'open-market sale'
  if (code === 'A') return 'stock award/grant'
  if (code === 'M') return 'option exercise'
  const ad = String(t.acquired_disposed_code || '').toUpperCase()
  if (ad === 'D') return 'sale'
  if (ad === 'A') return 'acquisition'
  return String(t.transaction_type || t.trade_type || 'transaction').toLowerCase()
}

function txValue(t) {
  if (t.total_value != null && !Number.isNaN(Number(t.total_value))) return Number(t.total_value)
  return (Number(t.shares) || 0) * (Number(t.price_per_share ?? t.price) || 0)
}

function usd(n) {
  const v = Number(n) || 0
  if (v >= 1e6) return '$' + (v / 1e6).toFixed(1) + 'M'
  if (v >= 1e3) return '$' + Math.round(v / 1e3) + 'K'
  return '$' + Math.round(v)
}

const SYSTEM_PROMPT = [
  'You lay out the bull case and bear case for a stock, using ONLY the sources provided in the user message (recent news items and SEC Form 4 insider filings for that company).',
  'Hard rules:',
  '1. Every point you make MUST be supported by one of the provided sources. In each point, name the source it comes from (the news headline/outlet, or the specific Form 4 filing).',
  '2. Do NOT use outside knowledge or invent facts that are not in the provided sources.',
  '3. Do NOT predict the share price or its direction. Do NOT say whether to buy, sell, or hold. You are surfacing arguments, not giving advice.',
  '4. Distinguish real conviction from noise: an open-market purchase by an insider is meaningful; a stock award or option exercise is compensation, not a bet — treat them accordingly.',
  '5. If the evidence is thin or only supports one side, say so honestly. A side may legitimately be empty.',
  'Respond with ONLY a valid JSON object, no prose around it, shaped exactly like:',
  '{"bull":[{"point":"...","source":"..."}],"bear":[{"point":"...","source":"..."}],"evidence_note":"one honest sentence on how much/what kind of evidence this is based on"}',
].join('\n')

export async function GET(request) {
  try {
    const url = new URL(request.url)
    const ticker = String(url.searchParams.get('ticker') || '').trim().toUpperCase()
    if (!ticker) return NextResponse.json({ error: 'ticker is required' }, { status: 400 })

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      // Never fake analysis. Say plainly that the AI isn't configured.
      return NextResponse.json({ available: false, reason: 'ANTHROPIC_API_KEY is not set' })
    }

    const { data: company } = await supabase
      .from('companies')
      .select('id, ticker, name, sector')
      .eq('ticker', ticker)
      .single()
    if (!company) return NextResponse.json({ error: `No company found for ${ticker}` }, { status: 404 })

    const now = Date.now()
    const newsSince = new Date(now - NEWS_WINDOW_DAYS * 86400000).toISOString()
    const insiderSince = new Date(now - INSIDER_WINDOW_DAYS * 86400000).toISOString().slice(0, 10)

    // News for this ticker
    const { data: impacts } = await supabase
      .from('article_stock_impacts').select('article_id').eq('ticker', ticker)
    const ids = [...new Set((impacts || []).map((i) => i.article_id).filter(Boolean))]
    let news = []
    if (ids.length) {
      const { data } = await supabase
        .from('news_articles')
        .select('headline, summary, source, published_at')
        .in('id', ids).gte('published_at', newsSince)
        .order('published_at', { ascending: false, nullsFirst: false }).limit(15)
      news = data || []
    }

    // Insider filings for this company
    const { data: txns } = await supabase
      .from('insider_transactions')
      .select('transaction_date, transaction_code, transaction_type, trade_type, acquired_disposed_code, shares, price_per_share, price, total_value, insider_name, insider_title')
      .eq('company_id', company.id).gte('transaction_date', insiderSince)
      .order('transaction_date', { ascending: false }).limit(12)
    const tx = txns || []

    if (news.length === 0 && tx.length === 0) {
      return NextResponse.json({
        available: true,
        bull: [], bear: [],
        evidence_note: 'No recent news or insider filings are on record for this company yet, so there is nothing to argue from.',
        model: MODEL,
        sources_used: { news: 0, insider_filings: 0 },
      })
    }

    // Compile the sources into a compact, clearly-labelled block.
    const newsBlock = news.length
      ? news.map((a, i) => `N${i + 1}. [${a.source || 'unknown outlet'}, ${(a.published_at || '').slice(0, 10)}] "${a.headline}"${a.summary ? ' — ' + String(a.summary).slice(0, 240) : ''}`).join('\n')
      : '(no recent news)'
    const insiderBlock = tx.length
      ? tx.map((t, i) => `F${i + 1}. ${t.insider_name || 'Unknown'}${t.insider_title ? ' (' + t.insider_title + ')' : ''} — ${classify(t)} of ${usd(txValue(t))} on ${t.transaction_date || 'unknown date'}`).join('\n')
      : '(no recent insider filings)'

    const userMessage =
      `Company: ${company.name} (${company.ticker})${company.sector ? ', sector: ' + company.sector : ''}\n\n` +
      `RECENT NEWS SOURCES:\n${newsBlock}\n\n` +
      `RECENT SEC FORM 4 INSIDER FILINGS:\n${insiderBlock}\n\n` +
      `Produce the bull case and bear case using ONLY the sources above, following all the rules.`

    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1400,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userMessage }],
      }),
    })

    const raw = await resp.text()
    if (!resp.ok) {
      // Surface the real API error (e.g. bad model name, auth) instead of faking.
      return NextResponse.json({ available: false, reason: `Anthropic API error ${resp.status}`, detail: raw.slice(0, 300) }, { status: 502 })
    }

    let parsed
    try {
      const data = JSON.parse(raw)
      const text = (data.content || []).map((b) => b.text || '').join('').trim()
      // The model may wrap JSON in stray text; extract the outermost object.
      const start = text.indexOf('{')
      const end = text.lastIndexOf('}')
      parsed = JSON.parse(start >= 0 && end >= 0 ? text.slice(start, end + 1) : text)
    } catch {
      return NextResponse.json({ available: false, reason: 'Could not parse AI response' }, { status: 502 })
    }

    return NextResponse.json({
      available: true,
      bull: Array.isArray(parsed.bull) ? parsed.bull : [],
      bear: Array.isArray(parsed.bear) ? parsed.bear : [],
      evidence_note: parsed.evidence_note || null,
      model: MODEL,
      sources_used: { news: news.length, insider_filings: tx.length },
    })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
