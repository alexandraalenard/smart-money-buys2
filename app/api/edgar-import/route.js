import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const UA = 'TheHiddenLedger research contact@thehiddenledger.com'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

function extractBetween(text, start, end) {
  const s = text.indexOf(start)
  if (s === -1) return null
  const e = text.indexOf(end, s + start.length)
  if (e === -1) return null
  return text.slice(s + start.length, e).trim()
}

function extractValue(text, tag) {
  const block = extractBetween(text, '<' + tag + '>', '</' + tag + '>')
  if (!block) return null
  if (block.includes('<value>')) return extractBetween(block, '<value>', '</value>')
  return block.trim()
}

function parseForm4XML(xml) {
  const trades = []
  const insiderName = extractValue(xml, 'rptOwnerName') || 'Unknown'
  const officerTitle = extractValue(xml, 'officerTitle') || ''
  const isDirector = xml.includes('<isDirector>1</isDirector>') || xml.includes('<isDirector>true</isDirector>')
  const isOfficer = xml.includes('<isOfficer>1</isOfficer>') || xml.includes('<isOfficer>true</isOfficer>')
  const title = officerTitle || (isDirector ? 'Director' : (isOfficer ? 'Officer' : 'Insider'))

  const txRegex = /<nonDerivativeTransaction>([\s\S]*?)<\/nonDerivativeTransaction>/g
  let m
  while ((m = txRegex.exec(xml)) !== null) {
    const block = m[1]
    const code = extractValue(block, 'transactionCode')
    const shares = parseFloat(extractValue(block, 'transactionShares') || '0')
    const price = parseFloat(extractValue(block, 'transactionPricePerShare') || '0')
    const date = extractValue(block, 'transactionDate')
    const type = code === 'P' ? 'BUY' : code === 'S' ? 'SELL' : null
    if (type && shares > 0 && price > 0) {
      trades.push({ insiderName, insiderTitle: title, type, shares, price, total: shares * price, date })
    }
  }
  return trades
}

export async function GET(request) {
  try {
    const url = new URL(request.url)
    const offset = parseInt(url.searchParams.get('offset') || '0', 10)
    const limit = parseInt(url.searchParams.get('limit') || '6', 10)
    const perCompany = parseInt(url.searchParams.get('perCompany') || '8', 10)

    const { data: companies, error: cErr } = await supabase
      .from('companies').select('id, ticker, name').order('ticker')
    if (cErr) return NextResponse.json({ error: cErr.message }, { status: 500 })
    if (!companies || !companies.length) return NextResponse.json({ error: 'No companies' }, { status: 400 })
    const slice = companies.slice(offset, offset + limit)

    const ctRes = await fetch('https://www.sec.gov/files/company_tickers.json', { headers: { 'User-Agent': UA } })
    const ct = await ctRes.json()
    const cikByTicker = {}
    for (const k in ct) cikByTicker[ct[k].ticker] = ct[k].cik_str

    let inserted = 0
    const results = []

    for (const company of slice) {
      const cikNum = cikByTicker[company.ticker]
      if (!cikNum) { results.push({ ticker: company.ticker, skipped: 'no CIK' }); continue }
      const cik10 = String(cikNum).padStart(10, '0')

      let hits = []
      try {
        const ftsRes = await fetch('https://efts.sec.gov/LATEST/search-index?q=&forms=4&ciks=' + cik10, { headers: { 'User-Agent': UA } })
        if (ftsRes.ok) {
          const fts = await ftsRes.json()
          hits = ((fts.hits && fts.hits.hits) || []).slice(0, perCompany)
        }
      } catch (e) { results.push({ ticker: company.ticker, ftsError: e.message }); continue }
      await sleep(120)

      let companyTrades = 0
      for (const hit of hits) {
        const src = hit._source || {}
        const adsh = src.adsh
        const idParts = (hit._id || '').split(':')
        const filename = idParts[1]
        if (!adsh || !filename) continue
        const filerCik = parseInt(adsh.split('-')[0], 10)
        const adshNoDash = adsh.replace(/-/g, '')
        const xmlUrl = 'https://www.sec.gov/Archives/edgar/data/' + filerCik + '/' + adshNoDash + '/' + filename
        const filingUrl = 'https://www.sec.gov/Archives/edgar/data/' + filerCik + '/' + adshNoDash + '/'
        try {
          const xmlRes = await fetch(xmlUrl, { headers: { 'User-Agent': UA } })
          if (!xmlRes.ok) { await sleep(80); continue }
          const xml = await xmlRes.text()
          const trades = parseForm4XML(xml)
          for (const tx of trades) {
            let { data: insider } = await supabase.from('insiders')
              .select('id').eq('name', tx.insiderName).eq('company_id', company.id).maybeSingle()
            if (!insider) {
              const { data: ni } = await supabase.from('insiders')
                .insert({ name: tx.insiderName, title: tx.insiderTitle, company_id: company.id })
                .select('id').single()
              insider = ni
            }
            if (!insider) continue
            const { error: tErr } = await supabase.from('insider_transactions').upsert({
              company_id: company.id,
              insider_id: insider.id,
              insider_name: tx.insiderName,
              insider_title: tx.insiderTitle,
              transaction_date: tx.date,
              trade_date: tx.date,
              shares: tx.shares,
              price_per_share: tx.price,
              total_value: tx.total,
              transaction_type: tx.type,
              trade_type: tx.type,
              source: 'SEC Form 4',
              source_type: 'sec_edgar',
              form4_url: filingUrl
            }, { onConflict: 'company_id,insider_id,transaction_date,shares' })
            if (!tErr) { inserted++; companyTrades++ }
          }
        } catch (e) { /* skip this filing */ }
        await sleep(100)
      }
      results.push({ ticker: company.ticker, cik: cikNum, filings: hits.length, trades: companyTrades })
    }

    const nextOffset = offset + limit
    return NextResponse.json({
      success: true,
      processed: slice.map((c) => c.ticker),
      inserted,
      results,
      next_offset: nextOffset,
      done: nextOffset >= companies.length,
      total_companies: companies.length
    })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
