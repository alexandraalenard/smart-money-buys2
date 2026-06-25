import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

function extractBetween(text, start, end) {
  const s = text.indexOf(start)
  if (s === -1) return null
  const e = text.indexOf(end, s + start.length)
  if (e === -1) return null
  return text.slice(s + start.length, e).trim()
}

function parseForm4XML(xml) {
  const trades = []
  const insiderName = extractBetween(xml, '<rptOwnerName>', '</rptOwnerName>') || 'Unknown'
  const insiderTitle = extractBetween(xml, '<officerTitle>', '</officerTitle>') || ''
  const isDirector = xml.includes('<isDirector>1</isDirector>')

  const txRegex = /<nonDerivativeTransaction>([\s\S]*?)<\/nonDerivativeTransaction>/g
  let match
  while ((match = txRegex.exec(xml)) !== null) {
    const block = match[1]
    const code = extractBetween(block, '<transactionCode>', '</transactionCode>')
    const shares = parseFloat(extractBetween(block, '<transactionShares>', '</transactionShares>') || '0')
    const price = parseFloat(extractBetween(block, '<transactionPricePerShare>', '</transactionPricePerShare>') || '0')
    const date = extractBetween(block, '<transactionDate>', '</transactionDate>')
    const type = code === 'P' ? 'BUY' : code === 'S' ? 'SELL' : null
    if (type && shares > 0 && price > 0) {
      trades.push({ insiderName, insiderTitle: insiderTitle || (isDirector ? 'Director' : 'Insider'), type, shares, price, total: shares * price, date })
    }
  }
  return trades
}

export async function GET(request) {
  try {
    const { data: companies } = await supabase.from('companies').select('id, ticker, name')
    if (!companies?.length) return NextResponse.json({ error: 'No companies found' }, { status: 400 })

    const companyMap = {}
    for (const c of companies) companyMap[c.ticker] = c

    const tickers = companies.map(c => c.ticker)
    let totalInserted = 0
    const results = []

    for (let i = 0; i < Math.min(tickers.length, 20); i += 10) {
      const batch = tickers.slice(i, i + 10)
      const tickerQuery = batch.join(' OR ')

      const res = await fetch(`https://api.sec-api.io?token=${process.env.SEC_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: {
            query_string: {
              query: `formType:"4" AND ticker:(${tickerQuery}) AND filedAt:[2024-01-01 TO *]`
            }
          },
          from: 0,
          size: 10,
          sort: [{ filedAt: { order: 'desc' } }]
        })
      })

      if (!res.ok) { results.push({ batch, error: await res.text() }); continue }
      const data = await res.json()
      const filings = data.filings || []

      for (const filing of filings) {
        const ticker = filing.ticker
        const company = companyMap[ticker]
        if (!company) continue

        // Prefer raw form4.xml over stylesheet version
        const xmlUrl = filing.documentFormatFiles?.find(f =>
          f.documentUrl?.endsWith('form4.xml') || f.documentUrl?.endsWith('doc4.xml')
        )?.documentUrl ||
        filing.documentFormatFiles?.find(f =>
          f.type === '4' && !f.documentUrl?.includes('xslF345')
        )?.documentUrl ||
        filing.documentFormatFiles?.[1]?.documentUrl

        if (!xmlUrl) continue

        try {
          const xmlRes = await fetch(xmlUrl, {
            headers: { 'User-Agent': 'TheHiddenLedger contact@thehiddenledger.com' }
          })
          if (!xmlRes.ok) continue
          const xml = await xmlRes.text()
          const trades = parseForm4XML(xml)

          results.push({ ticker, xmlUrl, trades_found: trades.length })

          for (const tx of trades) {
            let { data: insider } = await supabase
              .from('insiders').select('id')
              .eq('name', tx.insiderName).eq('company_id', company.id).maybeSingle()

            if (!insider) {
              const { data: ni } = await supabase.from('insiders')
                .insert({ name: tx.insiderName, title: tx.insiderTitle, company_id: company.id })
                .select('id').single()
              insider = ni
            }
            if (!insider) continue

            const { error } = await supabase.from('trades').upsert({
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
              form4_url: filing.linkToFilingDetails || ''
            }, { onConflict: 'company_id,insider_id,transaction_date,shares' })

            if (!error) totalInserted++
          }
        } catch (e) {
          results.push({ ticker, xmlError: e.message })
        }
      }

      results.push({ batch, filings_found: filings.length })
    }

    return NextResponse.json({ success: true, total_inserted: totalInserted, results })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}