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
      const tickerQuery = batch.map(t => `"${t}"`).join(' OR ')

      const url = `https://api.sec-api.io/insider-trading?token=${process.env.SEC_API_KEY}`

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: {
            query_string: {
              query: `issuer.tradingSymbol:(${tickerQuery}) AND periodOfReport:[2024-01-01 TO *]`
            }
          },
          from: 0,
          size: 50,
          sort: [{ periodOfReport: { order: 'desc' } }]
        })
      })

      const text = await res.text()

      if (!res.ok) {
        results.push({ batch, status: res.status, error: text.slice(0, 200) })
        continue
      }

      let data
      try {
        data = JSON.parse(text)
      } catch (e) {
        results.push({ batch, error: 'Invalid JSON: ' + text.slice(0, 200) })
        continue
      }

      const filings = data.data || []