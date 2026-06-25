import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const SEC_UA = { 'User-Agent': 'SmartMoneyBuys contact@smartmoneybuys.com' }

export async function GET(request) {
  try {
    const { data: companies } = await supabase.from('companies').select('id, ticker')
    if (!companies?.length) return NextResponse.json({ error: 'No companies' }, { status: 400 })

    const results = []

    for (const company of companies.slice(0, 5)) {
      try {
        const searchRes = await fetch(
          `https://efts.sec.gov/LATEST/search-index?q=%22${company.ticker}%22&forms=4&dateRange=custom&startdt=2026-01-01`,
          { headers: SEC_UA }
        )
        if (!searchRes.ok) { results.push({ ticker: company.ticker, status: 'search_failed' }); continue }
        const searchData = await searchRes.json()
        const hits = searchData.hits?.hits || []
        results.push({ ticker: company.ticker, status: 'ok', count: hits.length })
      } catch (e) {
        results.push({ ticker: company.ticker, status: 'error', error: e.message })
      }
    }

    return NextResponse.json({ success: true, results })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}