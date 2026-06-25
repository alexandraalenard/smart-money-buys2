import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const SEC_UA = { 'User-Agent': 'SmartMoneyBuys contact@smartmoneybuys.com' }

async function fetchForm4sForTicker(ticker) {
  try {
    // Use EDGAR full text search to find Form 4 filings
    const url = `https://efts.sec.gov/LATEST/search-index?q=%22${ticker}%22&forms=4&dateRange=custom&startdt=2024-01-01`
    const res = await fetch(url, { headers: SEC_UA })
    if (!res.ok) return []
    const data = await res.json()
    return (data.hits?.hits || []).slice(0, 10)
  } catch (e) {
    return []
  }
}

async function getFilingXML(accessionNo, cik) {
  try {
    const acc = accessionNo.replace(/-/g, '')
    const cikInt = parseInt(cik)
    const xmlUrl = `https://www.sec.gov/Archives/edgar/data/${cikInt}/${acc}/${accessionNo}.xml`
    const res = await fetch(xmlUrl, { headers: SEC_UA })
    if (res.ok) return await res.text()

    // Try .txt fallback
    const txtUrl = `https://www.sec.gov/Archives/edgar/data/${cikInt}/${acc}.txt`
    const res2 = await fetch(txtUrl, { headers: SEC_UA })
    if (res2.ok) return await res2.text()

    return null
  } catch (e) {
    return null
  }
}

function extractTradeFromXML(text, accessionNo) {
  try {
    const ownerName = text.match(/<rptOwnerName>([^<]+)<\/rptOwnerName>/)?.[1]?.trim()
    const title = text.match(/<officerTitle>([^<]+)<\/officerTitle>/)?.[1]?.trim() || 'Director'
    const shares = text.match(/<transactionShares>[\s\S]*?<value>([\d.]+)<\/value>/)?.[1]
    const price = text.match(/<transactionPricePerShare>[\s\S]*?<value>([\d.]+)<\/value>/)?.[1]
    const code = text.match(/<transactionCode>([A-Z])<\/transactionCode>/)?.[1]
    const date = text.match(/<transactionDate>[\s\S]*?<value>([\d-]+)<\/value>/)?.[1]

    if (!ownerName || !shares || !date) return null

    const sharesNum = parseFloat(shares)
    const priceNum = parseFloat(price || '0')
    const type = code === 'P' ? 'BUY' : code === 'S' ? 'SELL' : null
    if (!type || sharesNum <= 0) return null

    return {
      insider_name: ownerName,
      insider_title: title,
      transaction_type: type,
      shares: Math.round(sharesNum),
      price_per_share: priceNum,
      total_value: Math.round(sharesNum * priceNum),
      transaction_date: date,
      source: `SEC Form 4 · ${accessionNo}`,
      source_type: 'SEC_FORM4',
    }
  } catch (e) {
    return null
  }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const limit = parseInt(searchParams.get('limit') || '10')
  const offset = parseInt(searchParams.get('offset') || '0')

  try {
    const { data: companies } = await supabase
      .from('companies')
      .select('id, ticker, name')
      .range(offset, offset + limit - 1)
      .order('ticker')

    // Load CIK map
    const tickerRes = await fetch('https://www.sec.gov/files/company_tickers.json', { headers: SEC_UA })
    const tickerData = await tickerRes.json()
    const tickerMap = {}
    for (const key of Object.keys(tickerData)) {
      tickerMap[tickerData[key].ticker] = String(tickerData[key].cik_str).padStart(10, '0')
    }

    const results = []
    let totalNewTrades = 0

    for (const company of companies) {
      const cik = tickerMap[company.ticker]
      if (!cik) { results.push({ ticker: company.ticker, status: 'no_cik' }); continue }

      try {
        // Get recent Form 4 filings from submissions API
        const subRes = await fetch(`https://data.sec.gov/submissions/CIK${cik}.json`, { headers: SEC_UA })
        if (!subRes.ok) { results.push({ ticker: company.ticker, status: 'no_submissions' }); continue }
        
        const subData = await subRes.json()
        const recent = subData.filings?.recent
        if (!recent) { results.push({ ticker: company.ticker, status: 'no_filings' }); continue }

        // Find Form 4 filings
        const form4s = []
        for (let i = 0; i < recent.form.length; i++) {
          if (recent.form[i] === '4') {
            form4s.push({
              accession: recent.accessionNumber[i],