import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const SEC_HEADERS = {
  'User-Agent': 'SmartMoneyBuys contact@smartmoneybuys.com',
}

async function getForm4Filings(cik) {
  try {
    const res = await fetch(
      `https://data.sec.gov/submissions/CIK${cik}.json`,
      { headers: SEC_HEADERS }
    )
    if (!res.ok) return []
    const data = await res.json()
    const filings = data.filings?.recent
    if (!filings) return []
    const form4s = []
    for (let i = 0; i < filings.form.length; i++) {
      if (filings.form[i] === '4' || filings.form[i] === '4/A') {
        form4s.push({
          accessionNumber: filings.accessionNumber[i],
          filingDate: filings.filingDate[i],
        })
        if (form4s.length >= 15) break
      }
    }
    return form4s
  } catch (e) {
    return []
  }
}

async function parseForm4(cik, accessionNumber) {
  try {
    const accNoClean = accessionNumber.replace(/-/g, '')
    const xmlUrl = `https://www.sec.gov/Archives/edgar/data/${parseInt(cik)}/${accNoClean}.txt`
    const res = await fetch(xmlUrl, { headers: SEC_HEADERS })
    if (!res.ok) return null
    const text = await res.text()

    const getName = (tag) => {
      const match = text.match(new RegExp(`<${tag}[^>]*>([^<]+)<\/${tag}>`, 'i'))
      return match ? match[1].trim() : null
    }

    const rptOwnerName = getName('rptOwnerName')
    const officerTitle = getName('officerTitle') || 'Director'
    const transactionShares = text.match(/<transactionShares>[\s\S]*?<value>([\d.]+)<\/value>/)?.[1]
    const transactionPrice = text.match(/<transactionPricePerShare>[\s\S]*?<value>([\d.]+)<\/value>/)?.[1]
    const transactionCode = text.match(/<transactionCode>([A-Z])<\/transactionCode>/)?.[1]
    const transactionDate = text.match(/<transactionDate>[\s\S]*?<value>([\d-]+)<\/value>/)?.[1]

    if (!rptOwnerName || !transactionShares) return null

    const shares = parseFloat(transactionShares)
    const price = parseFloat(transactionPrice || '0')
    const type = transactionCode === 'P' ? 'BUY' : transactionCode === 'S' ? 'SELL' : null
    if (!type || shares <= 0) return null

    return {
      insider_name: rptOwnerName,
      insider_title: officerTitle,
      transaction_type: type,
      shares: Math.round(shares),
      price_per_share: price,
      total_value: Math.round(shares * price),
      transaction_date: transactionDate,
      source: `SEC Form 4 · ${accessionNumber}`,
      source_type: 'SEC_FORM4',
    }
  } catch (e) {
    return null
  }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const limit = parseInt(searchParams.get('limit') || '20')
  const offset = parseInt(searchParams.get('offset') || '0')

  try {
    const { data: companies } = await supabase
      .from('companies')
      .select('id, ticker, name')
      .range(offset, offset + limit - 1)
      .order('ticker')

    let tickerMap = {}
    const tickerRes = await fetch(
      'https://www.sec.gov/files/company_tickers.json',
      { headers: SEC_HEADERS }
    )
    const tickerData = await tickerRes.json()
    for (const key of Object.keys(tickerData)) {
      tickerMap[tickerData[key].ticker] = String(tickerData[key].cik_str).padStart(10, '0')
    }

    const results = []
    let totalNewTrades = 0

    for (const company of companies) {
      const cik = tickerMap[company.ticker]
      if (!cik) { results.push({ ticker: company.ticker, status: 'no_cik' }); continue }

      const filings = await getForm4Filings(cik)
      let newTrades = 0

      for (const filing of filings.slice(0, 8)) {
        const trade = await parseForm4(cik, filing.accessionNumber)
        if (!trade) continue

        const { data: existing } = await supabase
          .from('trades').select('id')
          .eq('company_id', company.id)
          .eq('transaction_date', trade.transaction_date)
          .eq('insider_name', trade.insider_name)
          .single()

        if (!existing) {
          await supabase.from('trades').insert({ ...trade, company_id: company.id })
          newTrades++
        }
        await new Promise(r => setTimeout(r, 150))
      }

      totalNewTrades += newTrades
      results.push({ ticker: company.ticker, status: 'ok', trades: newTrades })
      await new Promise(r => setTimeout(r, 200))
    }

    return NextResponse.json({ success: true, processed: companies.length, totalNewTrades, results })
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}