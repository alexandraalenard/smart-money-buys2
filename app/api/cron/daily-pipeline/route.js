import { NextResponse } from 'next/server'

export async function GET(request) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://smart-money-buys2.vercel.app'

    // Step 1: Fetch new filings
    const fetchRes = await fetch(`${baseUrl}/api/fetch-filings`, {
      headers: { 'x-cron-secret': process.env.CRON_SECRET || '' }
    })
    const fetchData = await fetchRes.json()

    // Step 2: Recalculate scores
    const scoresRes = await fetch(`${baseUrl}/api/calculate-scores`, {
      headers: { 'x-cron-secret': process.env.CRON_SECRET || '' }
    })
    const scoresData = await scoresRes.json()

    return NextResponse.json({
      success: true,
      fetch: fetchData,
      scores: scoresData,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}