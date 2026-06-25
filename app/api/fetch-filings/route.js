import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function GET() {
  try {
    const rssResponse = await fetch(
      'https://www.sec.gov/cgi-bin/browse-edgar?action=getcurrent&type=4&dateb=&owner=include&count=40&search_text=&output=atom',
      { headers: { 'User-Agent': 'SmartMoneyBuys contact@smartmoneybuys.com' } }
    )

    const rssText = await rssResponse.text()
    const entries = rssText.match(/<entry>([\s\S]*?)<\/entry>/g) || []
    let processed = 0

    for (const entry of entries.slice(0, 20)) {
      const title = entry.match(/<title>(.*?)<\/title>/)?.[1] || ''
      const titleMatch = title.match(/4 - (.*?)\((\w+)\)/)
      if (!titleMatch) continue
      const companyName = titleMatch[1].trim()
      const ticker = titleMatch[2].trim()
      if (!ticker || ticker.length > 5) continue

      const { data: company } = await supabase
        .from('companies')
        .upsert({ ticker, name: companyName, country: 'US' }, { onConflict: 'ticker' })
        .select()
        .single()

      if (company) {
        await supabase.from('cron_logs').insert({
          status: 'success',
          message: `Processed filing for ${ticker}`,
          records_processed: 1
        })
        processed++
      }
    }

    return Response.json({
      success: true,
      message: `Processed ${processed} filings`,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 })
  }
}