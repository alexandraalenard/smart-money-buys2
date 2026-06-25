import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export async function GET(request) {
  try {
    const { data: companies } = await supabase
      .from('companies')
      .select('id, ticker, name')

    if (!companies?.length) {
      return NextResponse.json({ error: 'No companies found' }, { status: 400 })
    }

    const companyMap = {}
    for (const c of companies) companyMap[c.ticker] = c

    const tickers = companies.map(c => c.ticker)
    let totalInserted = 0
    const results = []

    // Process in batches of 10 tickers at a time
    for (let i = 0; i < Math.min(tickers.length, 50); i += 10) {
      const batch = tickers.slice(i, i + 10)
      const tickerQuery = batch.map(t => `"${t}"`).join(' OR ')

      const res = await fetch('https://api.sec-api.io/insider-trading', {
        method: 'POST',
        headers: {
          'Authorization': process.env.SEC_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: `issuer.tradingSymbol:(${tickerQuery}) AND periodOfReport:[2024-01-01 TO *]`,
          from: 0,
          size: 50,
          sort: [{ periodOfReport: { order: 'desc' } }]
        })
      })

      if (!res.ok) {
        const err = await res.text()
        results.push({ batch, error: err })
        continue
      }

      const data = await res.json()
      const filings = data.data || []

      for (const filing of filings) {
        const ticker = filing.issuer?.tradingSymbol
        const company = companyMap[ticker]
        if (!company) continue

        const insiderName = filing.reportingOwner?.name || 'Unknown'
        const insiderTitle = filing.reportingOwner?.relationship?.officerTitle || 
                            (filing.reportingOwner?.relationship?.isDirector ? 'Director' : 'Insider')

        // Get or create insider
        let { data: insider } = await supabase
          .from('insiders')
          .select('id')
          .eq('name', insiderName)
          .eq('company_id', company.id)
          .maybeSingle()

        if (!insider) {
          const { data: newInsider } = await supabase
            .from('insiders')
            .insert({ name: insiderName, title: insiderTitle, company_id: company.id })
            .select('id')
            .single()
          insider = newInsider
        }

        if (!insider) continue

        // Process non-derivative transactions
        const transactions = filing.nonDerivativeTable?.transactions || []
        for (const tx of transactions) {
          const code = tx.coding?.code
          const type = code === 'P' ? 'BUY' : code === 'S' ? 'SELL' : null
          if (!type) continue

          const shares = parseFloat(tx.amounts?.shares) || 0
          const price = parseFloat(tx.amounts?.pricePerShare) || 0
          const total = shares * price
          const date = tx.transactionDate || filing.periodOfReport

          if (shares === 0 || price === 0) continue

          const { error } = await supabase.from('trades').upsert({
            company_id: company.id,
            insider_id: insider.id,
            insider_name: insiderName,
            insider_title: insiderTitle,
            transaction_date: date,
            trade_date: date,
            shares,
            price_per_share: price,
            total_value: total,
            transaction_type: type,
            trade_type: type,
            source: 'SEC Form 4',
            source_type: 'sec_edgar',
            form4_url: `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${filing.issuer?.cik}&type=4`
          }, { onConflict: 'company_id,insider_id,transaction_date,shares' })

          if (!error) totalInserted++
        }

        results.push({ ticker, insider: insiderName, trades: transactions.length })
      }
    }

    return NextResponse.json({
      success: true,
      total_inserted: totalInserted,
      results
    })

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}