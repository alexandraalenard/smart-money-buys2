import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Market Pulse ingestion.
//
// Pulls real news from the free GDELT DOC 2.0 API for the companies we track and
// stores it in `news_articles`, tagging each article to the ticker(s) it matched
// via `article_stock_impacts`. No API key required for GDELT.
//
// HONESTY / SCOPE NOTES:
//   * We store ONLY what GDELT actually returns — headline, source domain, url,
//     publish date, language, country. We do NOT invent summaries, sentiment,
//     impact scores, or any up/down forecast. Those columns are left NULL.
//   * GDELT asks callers to keep to ~1 request every 5 seconds. We space our
//     per-company queries out with sleep() and process a small batch per call,
//     returning next_offset/done so a caller can page through the whole universe
//     (mirrors the /api/edgar-import pattern).

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const UA = 'TheHiddenLedger research contact@thehiddenledger.com'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// GDELT throttles free callers to ~1 request / 5s. Give it a margin.
const GDELT_GAP_MS = 6000

// Turn a stored company name into a precise GDELT phrase query. We quote the
// full legal name (e.g. "NVIDIA Corporation") so we favour precision over
// volume — an exact-phrase match rarely tags the wrong story (the fruit
// "apple", a travel "visa", etc.). Lower recall is the deliberate trade-off.
function buildQuery(name) {
  const clean = String(name || '').replace(/\s+/g, ' ').trim()
  if (!clean) return null
  return '"' + clean.replace(/"/g, '') + '"'
}

// GDELT seendate looks like "20260711T120000Z". Convert to an ISO timestamp.
function parseSeenDate(s) {
  if (!s || typeof s !== 'string') return null
  const m = s.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/)
  if (!m) return null
  return `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}Z`
}

async function fetchGdelt(query, maxrecords, timespan) {
  const url =
    'https://api.gdeltproject.org/api/v2/doc/doc' +
    '?query=' + encodeURIComponent(query) +
    '&mode=artlist' +
    '&maxrecords=' + maxrecords +
    '&format=json' +
    '&timespan=' + encodeURIComponent(timespan) +
    '&sort=datedesc'

  const res = await fetch(url, { headers: { 'User-Agent': UA } })
  const text = await res.text()

  // GDELT returns a plain-text notice (not JSON) when it rate-limits or errors.
  // Detect that instead of blindly JSON.parse-ing.
  const trimmed = text.trim()
  if (!trimmed || trimmed[0] !== '{') {
    return { articles: [], notice: trimmed.slice(0, 200) }
  }
  try {
    const json = JSON.parse(trimmed)
    return { articles: Array.isArray(json.articles) ? json.articles : [] }
  } catch {
    return { articles: [], notice: 'unparseable GDELT response' }
  }
}

export async function GET(request) {
  try {
    const url = new URL(request.url)
    const offset = parseInt(url.searchParams.get('offset') || '0', 10)
    const limit = parseInt(url.searchParams.get('limit') || '6', 10)
    const maxrecords = parseInt(url.searchParams.get('maxrecords') || '25', 10)
    const timespan = url.searchParams.get('timespan') || '3d'

    const { data: companies, error: cErr } = await supabase
      .from('companies')
      .select('id, ticker, name')
      .order('ticker')
    if (cErr) return NextResponse.json({ error: cErr.message }, { status: 500 })
    if (!companies || !companies.length) {
      return NextResponse.json({ error: 'No companies' }, { status: 400 })
    }

    const slice = companies.slice(offset, offset + limit)

    let articlesUpserted = 0
    let tagsUpserted = 0
    const results = []

    for (let i = 0; i < slice.length; i++) {
      const company = slice[i]
      const query = buildQuery(company.name)
      if (!query) {
        results.push({ ticker: company.ticker, skipped: 'no name' })
        continue
      }

      // Space out GDELT requests (no sleep before the very first one).
      if (i > 0) await sleep(GDELT_GAP_MS)

      let gdelt
      try {
        gdelt = await fetchGdelt(query, maxrecords, timespan)
      } catch (e) {
        results.push({ ticker: company.ticker, error: e.message })
        continue
      }
      if (gdelt.notice) {
        results.push({ ticker: company.ticker, gdeltNotice: gdelt.notice, articles: 0 })
        continue
      }

      // Build article rows, de-duped by url (a single ON CONFLICT statement
      // cannot touch the same url twice, and GDELT can repeat urls).
      const byUrl = new Map()
      for (const a of gdelt.articles) {
        const link = a.url
        const headline = a.title
        if (!link || !headline) continue
        if (byUrl.has(link)) continue
        byUrl.set(link, {
          headline: String(headline).trim(),
          url: link,
          source: a.domain || null,      // source domain, e.g. "reuters.com"
          published_at: parseSeenDate(a.seendate),
          // Deliberately NULL: summary, category, impact, insider_signal,
          // insider_note — we do not fabricate any of these.
        })
      }

      const rows = [...byUrl.values()]
      if (!rows.length) {
        results.push({ ticker: company.ticker, articles: 0 })
        continue
      }

      // Idempotent without depending on a DB-side unique constraint: look up
      // which urls we already have, insert only the new ones, then reuse the
      // ids for tagging. Re-running never duplicates an article.
      const urls = rows.map((r) => r.url)
      const idByUrl = new Map()
      const { data: existing, error: exErr } = await supabase
        .from('news_articles')
        .select('id, url')
        .in('url', urls)
      if (exErr) {
        results.push({ ticker: company.ticker, error: exErr.message })
        continue
      }
      for (const row of existing || []) idByUrl.set(row.url, row.id)

      const toInsert = rows.filter((r) => !idByUrl.has(r.url))
      if (toInsert.length) {
        const { data: inserted, error: aErr } = await supabase
          .from('news_articles')
          .insert(toInsert)
          .select('id, url')
        if (aErr) {
          results.push({ ticker: company.ticker, error: aErr.message })
          continue
        }
        for (const row of inserted || []) idByUrl.set(row.url, row.id)
        articlesUpserted += (inserted || []).length
      }

      // Tag every stored article to this company's ticker.
      const impacts = rows
        .map((r) => idByUrl.get(r.url))
        .filter(Boolean)
        .map((articleId) => ({
          article_id: articleId,
          company_id: company.id,
          ticker: company.ticker,
        }))
      const { error: iErr, count } = await supabase
        .from('article_stock_impacts')
        .upsert(impacts, { onConflict: 'article_id,ticker', count: 'exact' })
      if (iErr) {
        results.push({ ticker: company.ticker, articles: upserted.length, tagError: iErr.message })
        continue
      }
      tagsUpserted += (count ?? impacts.length)
      results.push({ ticker: company.ticker, articles: upserted.length })
    }

    const nextOffset = offset + limit
    return NextResponse.json({
      success: true,
      source: 'GDELT DOC 2.0',
      processed: slice.map((c) => c.ticker),
      articles_upserted: articlesUpserted,
      tags_upserted: tagsUpserted,
      results,
      next_offset: nextOffset,
      done: nextOffset >= companies.length,
      total_companies: companies.length,
    })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
