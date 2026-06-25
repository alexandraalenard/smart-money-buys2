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

    for (let i = 0; i < Math.min(tickers.length, 30); i += 10) {
      const batch = tickers.slice(i, i + 10)
      const tickerQuery = batch.join(' OR ')

      // Use the Filing Query API (free tier) to find Form 4 filings
      const url = `https://api.sec-api.io?token=${process.env.SEC_API_KEY}`

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: {
            query_string: {
              query: `formType:"4" AND ticker:(${tickerQuery}) AND filedAt:[2024-01-01 TO *]`
            }
          },
          from: 0,
          size: 50,
          sort: [{ filedAt: { order: 'desc' } }]
        })
      })

      const text = await res.text()

      if (!res.ok) {
        results.push({ batch, status: res.status, error: text.slice(0, 300) })
        continue
      }

      let data
      try {
        data = JSON.parse(text)
      } catch (e) {
        results.push({ batch, error: 'Invalid JSON: ' + text.slice(0, 300) })
        continue
      }

      const filings = data.filings || []
      results.push({ batch, filings_found: filings.length })

      for (const filing of filings) {
        const ticker = filing.ticker
        const company = companyMap[ticker]
        if (!company) continue

        // Fetch the actual Form 4 data from the insider trading endpoint
        const insiderRes = await fetch(
          `https://api.sec-api.io/insider-trading?token=${process.env.SEC_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              query: {
                query_string: {
                  query: `accessionNo:"${filing.accessionNo}"`
                }
              },
              from: 0,
              size: 1
            })
          }
        )

        if (!insiderRes.ok) continue
        const insiderData = await insiderRes.json()
        const form4 = insiderData.data?.[0]
        if (!form4) continue

        const insiderName = form4.reportingOwner?.name || 'Unknown'
        const insiderTitle = form4.reportingOwner?.relationship?.officerTitle ||
          (form4.reportingOwner?.relationship?.isDirector ? 'Director' : 'Insider')

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

        const transactions = form4.nonDerivativeTable?.transactions || []
        for (const tx of transactions) {
          const code = tx.coding?.code
          const type = code === 'P' ? 'BUY' : code === 'S' ? 'SELL' : null
          if (!type) continue

          const shares = parseFloat(tx.amounts?.shares) || 0
          const price = parseFloat(tx.amounts?.pricePerShare) || 0
          const total = shares * price
          const date = tx.transactionDate || form4.periodOfReport

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
            form4_url: filing.linkToFilingDetails || ''
          }, { onConflict: 'company_id,insider_id,transaction_date,shares' })

          if (!error) totalInserted++
        }
      }
    }

    return NextResponse.json({ success: true, total_inserted: totalInserted, results })

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}