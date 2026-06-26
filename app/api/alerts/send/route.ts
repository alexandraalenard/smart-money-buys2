import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// This route sends email alerts to opted-in subscribers.
// Trigger conditions: massive buy/sell on top-500, billionaire trade, or confidence score >= 80
// Call this from a cron job or Supabase Edge Function

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

const RESEND_API_KEY = process.env.RESEND_API_KEY || ''
const FROM_EMAIL = 'alerts@thehiddenledger.com'

async function sendEmail(to: string, subject: string, html: string) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: FROM_EMAIL, to, subject, html }),
  })
  return res.ok
}

function alertEmailHtml(type: string, data: any) {
  const { ticker, company, action, value, score, billionaire } = data
  const bgColor = '#07130E'
  const gold = '#C9A84C'
  const green = '#2D6A4F'

  let headline = ''
  let body = ''

  if (type === 'massive_trade') {
    headline = `${action === 'BUY' ? 'MASSIVE BUY' : 'MASSIVE SELL'} ALERT: ${ticker}`
    body = `<p style="color:#DFC48B">A significant insider transaction has been detected on <strong style="color:#C9A84C">${ticker} (${company})</strong>.</p>
    <p style="color:#F7F4EF">Transaction value: <strong style="color:#C9A84C">${value}</strong></p>
    <p style="color:#F7F4EF">Type: <strong>${action}</strong></p>`
  } else if (type === 'billionaire_trade') {
    headline = `BILLIONAIRE MOVE: ${billionaire} ${action === 'BUY' ? 'bought' : 'sold'} ${ticker}`
    body = `<p style="color:#DFC48B"><strong style="color:#C9A84C">${billionaire}</strong> has made a notable move on <strong style="color:#C9A84C">${ticker} (${company})</strong>.</p>
    <p style="color:#F7F4EF">Action: <strong>${action}</strong> &bull; Value: <strong style="color:#C9A84C">${value}</strong></p>`
  } else if (type === 'high_confidence') {
    headline = `HIGH CONFIDENCE SIGNAL: ${ticker} scored ${score}`
    body = `<p style="color:#DFC48B"><strong style="color:#C9A84C">${ticker} (${company})</strong> has reached a confidence score of <strong style="color:#C9A84C">${score}/100</strong>.</p>
    <p style="color:#F7F4EF">This exceeds our alert threshold of 80. Multiple insider signals are converging.</p>`
  }

  return `<!DOCTYPE html><html><body style="background:${bgColor};font-family:Inter,sans-serif;padding:32px;margin:0">
  <div style="max-width:600px;margin:0 auto">
    <div style="border-bottom:2px solid ${gold};padding-bottom:16px;margin-bottom:24px">
      <span style="font-weight:700;font-size:14px;letter-spacing:0.08em;color:#F7F4EF">THE </span>
      <span style="font-style:italic;font-size:14px;color:${gold}">HIDDEN </span>
      <span style="font-weight:700;font-size:14px;letter-spacing:0.08em;color:#F7F4EF">LEDGER</span>
    </div>
    <div style="background:${green};border:1px solid ${gold};border-radius:8px;padding:24px;margin-bottom:20px">
      <h2 style="color:${gold};margin:0 0 16px;font-size:18px">${headline}</h2>
      ${body}
    </div>
    <p style="color:#4a5568;font-size:12px;margin-top:24px">
      You are receiving this because you opted in to alerts. 
      <a href="${process.env.NEXT_PUBLIC_SITE_URL}/alerts/unsubscribe?email={{email}}" style="color:${gold}">Manage alert preferences</a>
    </p>
  </div></body></html>`
}

export async function POST(req: NextRequest) {
  // Verify internal secret so only cron/trusted callers can trigger
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.ALERT_CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { type, data } = await req.json()

  if (!['massive_trade', 'billionaire_trade', 'high_confidence'].includes(type)) {
    return NextResponse.json({ error: 'Invalid alert type' }, { status: 400 })
  }

  // Fetch subscribers who have opted in for this alert type
  const alertColumn = type === 'massive_trade' ? 'alert_massive_trades'
    : type === 'billionaire_trade' ? 'alert_billionaire_trades'
    : 'alert_high_confidence'

  const { data: subscribers, error } = await supabase
    .from('subscribers')
    .select('email')
    .eq('status', 'active')
    .eq(alertColumn, true)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const results = await Promise.allSettled(
    (subscribers || []).map(sub =>
      sendEmail(
        sub.email,
        type === 'massive_trade' ? `Hidden Ledger Alert: Massive ${data.action} on ${data.ticker}`
          : type === 'billionaire_trade' ? `Hidden Ledger: ${data.billionaire} made a move on ${data.ticker}`
          : `Hidden Ledger: ${data.ticker} hit a confidence score of ${data.score}`,
        alertEmailHtml(type, data).replace('{{email}}', sub.email)
      )
    )
  )

  const sent = results.filter(r => r.status === 'fulfilled').length
  return NextResponse.json({ sent, total: subscribers?.length || 0 })
}
