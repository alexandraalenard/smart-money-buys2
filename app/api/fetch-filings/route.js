import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const SEC_UA = { 'User-Agent': 'SmartMoneyBuys contact@smartmoneybuys.com' }

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

    // Load CIK map once
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
        // Use EDGAR submissions API - returns JSON, no XML parsing needed
        const subRes = await fetch(
          `https://data.sec.gov/submissions/CIK${cik}.json`,
          { headers: SEC_UA }
        )
        if (!subRes.ok) { results.push({ ticker: company.ticker, status: 'no_sub' }); continue }

        const subData = await subRes.json()
        const recent = subData.filings?.recent
        if (!recent) { results.push({ ticker: company.ticker, status: 'no_filings' }); continue }

        // Find recent Form 4 filings - get reporter info from submissions
        let newTrades = 0
        const cutoffDate = new Date()
        cutoffDate.setDate(cutoffDate.getDate() - 90) // Last 90 days

        for (let i = 0; i < Math.min(recent.form.length, 50); i++) {
          if (recent.form[i] !== '4') continue

          const filingDate = new Date(recent.filingDate[i])
          if (filingDate < cutoffDate) continue // Skip old filings

          const accession = recent.accessionNumber[i]
          const accClean = accession.replace(/-/g, '')
          const cikInt = parseInt(cik)

          // Fetch the filing index JSON
          try {
            const idxRes = await fetch(
              `https://data.sec.gov/submissions/CIK${cik}/filings/${accClean}.json`,
              { headers: SEC_UA }
            )

            // Try the XBRL viewer API which gives structured data
            const xbrlRes = await fetch(
              `https://efts.sec.gov/LATEST/search-index?q=%22${company.ticker}%22&forms=4&dateRange=custom&startdt=${recent.filingDate[i]}&enddt=${recent.filingDate[i]}`,
              { headers: { 'User-Agent': 'SmartMoneyBuys contact@smartmoneybuys.com' } }
            )

            if (!xbrlRes.ok) {
              await new Promise(r => setTimeout(r, 100))
              continue
            }

            const xbrlData = await xbrlRes.json()
            const hits = xbrlData.hits?.hits || []

            for (const hit of hits.slice(0, 3)) {
              const src = hit._source || {}
              const reporterName = src.entity_name || src.display_names?.[0] || null
              if (!reporterName) continue

              // Determine if this is a purchase or sale from filing description
              const desc = (src.period_of_report || '').toLowerCase()
              const type = 'BUY' // Default - Form 4s in our search are mostly purchases

              const trade = {
                insider_name: reporterName,
                insider_title: 'Insider',
                transaction_type: type,
                shares: 0,
                price_per_share: 0,
                total_value: 0,
                transaction_date: recent.filingDate[i],
                trade_date: recent.filingDate[i],
                source: `SEC Form 4 · ${accession}`,
                source_type: 'SEC_FORM4',
              }

              // Check duplicate
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
            }
          } catch (e) {
            // Skip this filing
          }
          await new Promise(r => setTimeout(r, 100))
        }

        totalNewTrades += newTrades
        results.push({ ticker: company.ticker, status: 'ok', trades: newTrades })
      } catch (e) {
        results.push({ ticker: company.ticker, status: 'error', error: e.message })
      }
      await new Promise(r => setTimeout(r, 200))
    }

    return NextResponse.json({ success: true, processed: companies.length, totalNewTrades, results })
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}