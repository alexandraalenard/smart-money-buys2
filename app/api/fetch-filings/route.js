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

    const tickers = companies.map(c => c.ticker)
    const companyMap = {}
    for (const c of companies) companyMap[c.ticker] = c.id

    // Query sec-api.io for real Form 4 insider trades
    const query = {
      query: {
        query_string: {
          query: `formType:"4" AND periodOfReport:[now-90d TO now]`
        }
      },
      from: '0',
      size: '50',
      sort: [{ filedAt: { order: 'desc' } }]
    }

    const secRes = await fetch('https://efts.sec.gov/LATEST/search-index?q=%22form+4%22&dateRange=custom&startdt=2025-01-01&forms=4', {
      headers: {
        'Authorization': process.env.SEC_API_KEY,
        'Content-Type': 'application/json'