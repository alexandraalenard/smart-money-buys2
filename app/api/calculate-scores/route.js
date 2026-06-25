import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

// --- SCORING RULES ---

function scoreInsiderTitle(title = '') {
  const t = title.toUpperCase()
  if (t.includes('CEO') || t.includes('CHIEF EXECUTIVE')) return 20
  if (t.includes('CFO') || t.includes('CHIEF FINANCIAL')) return 18
  if (t.includes('CHAIRMAN')) return 16
  if (t.includes('FOUNDER')) return 15
  if (t.includes('PRESIDENT')) return 14
  if (t.includes('COO') || t.includes('CHIEF OPERATING')) return 13
  if (t.includes('DIRECTOR')) return 12
  if (t.includes('SVP') || t.includes('SENIOR VP')) return 8
  if (t.includes('VP')) return 6
  return 3
}

function scorePurchaseSize(totalValue = 0) {
  if (totalValue >= 5000000) return 20
  if (totalValue >= 2000000) return 16
  if (totalValue >= 1000000) return 12
  if (totalValue >= 500000) return 8
  if (totalValue >= 100000) return 4
  if (totalValue >= 50000) return 2
  return 1
}

function scoreMultipleInsiders(trades = []) {
  const uniqueTitles = new Set(trades.map(t => t.insider_title?.toUpperCase()))
  const hasCEO = [...uniqueTitles].some(t => t?.includes('CEO'))
  const hasCFO = [...uniqueTitles].some(t => t?.includes('CFO'))
  const hasChairman = [...uniqueTitles].some(t => t?.includes('CHAIRMAN'))
  const count = trades.length

  let score = 0
  if (count >= 3) score += 25
  else if (count === 2) score += 15
  if (hasCEO && hasCFO) score += 10
  if (hasCEO && hasChairman) score += 8
  return Math.min(score, 35)
}

function scoreSamePeriod(trades = []) {
  if (trades.length < 2) return 0
  const dates = trades.map(t => new Date(t.transaction_date).getTime()).filter(Boolean)
  if (dates.length < 2) return 0
  const range = (Math.max(...dates) - Math.min(...dates)) / (1000 * 60 * 60 * 24)
  if (range <= 7) return 8
  if (range <= 30) return 4
  return 0
}

function scoreNoRecentSelling(allTrades = []) {
  const sells = allTrades.filter(t => t.transaction_type === 'SELL')
  const recentSells = sells.filter(t => {
    const d = new Date(t.transaction_date)
    const monthsAgo = (Date.now() - d.getTime()) / (1000 * 60 * 60 * 24 * 30)
    return monthsAgo <= 18
  })
  if (recentSells.length === 0) return 10
  if (recentSells.length <= 2) return 4
  return 0
}

// Compute the 5 component scores
function computeComponents(trades = []) {
  const buys = trades.filter(t => t.transaction_type === 'BUY' || t.transaction_type === 'P')
  const totalValue = buys.reduce((sum, t) => sum + (t.total_value || 0), 0)
  const topTrade = buys.sort((a, b) => (b.total_value || 0) - (a.total_value || 0))[0]

  // 1. Insider Conviction — quality of who is buying
  let insiderConviction = 0
  for (const t of buys) insiderConviction += scoreInsiderTitle(t.insider_title)
  insiderConviction = Math.min(Math.round(insiderConviction / Math.max(buys.length, 1) * 1.5), 100)

  // 2. Leadership Alignment — multiple seniors buying together
  let leadershipAlignment = scoreMultipleInsiders(buys) + scoreSamePeriod(buys)
  leadershipAlignment = Math.min(Math.round(leadershipAlignment * 2), 100)

  // 3. Historical Edge — pattern matching proxy (no selling + repeat buys)
  let historicalEdge = scoreNoRecentSelling(trades)
  if (buys.length >= 3) historicalEdge += 15
  if (buys.length >= 5) historicalEdge += 10
  historicalEdge = Math.min(Math.round(historicalEdge * 3.5), 100)

  // 4. Capital Commitment — size of the bet
  let capitalCommitment = scorePurchaseSize(topTrade?.total_value || 0)
  const totalScore = scorePurchaseSize(totalValue)
  capitalCommitment = Math.min(Math.round((capitalCommitment + totalScore) * 2.5), 100)

  // 5. AI Opportunity Rating — composite of all signals
  const rawComposite = (insiderConviction + leadershipAlignment + historicalEdge + capitalCommitment) / 4
  const aiOpportunity = Math.min(Math.round(rawComposite * 1.1), 100)

  return { insiderConviction, leadershipAlignment, historicalEdge, capitalCommitment, aiOpportunity }
}

function computeRawScore(components) {
  const { insiderConviction, leadershipAlignment, historicalEdge, capitalCommitment, aiOpportunity } = components
  return Math.round(
    insiderConviction * 0.25 +
    leadershipAlignment * 0.20 +
    historicalEdge * 0.20 +
    capitalCommitment * 0.20 +
    aiOpportunity * 0.15
  )
}

async function getAIAdjustment(ticker, components, trades) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) return { adjustment: 0, summary: null, reasons: [] }

    const buys = trades.filter(t => t.transaction_type === 'BUY' || t.transaction_type === 'P')
    const totalValue = buys.reduce((sum, t) => sum + (t.total_value || 0), 0)
    const insiderNames = [...new Set(buys.map(t => `${t.insider_name} (${t.insider_title})`))]

    const prompt = `You are analysing insider trading data for ${ticker}.

Recent insider purchases:
${insiderNames.slice(0, 5).join(', ')}
Total value purchased: $${totalValue.toLocaleString()}
Number of separate purchases: ${buys.length}
Base component scores: Insider Conviction ${components.insiderConviction}/100, Leadership Alignment ${components.leadershipAlignment}/100, Historical Edge ${components.historicalEdge}/100, Capital Commitment ${components.capitalCommitment}/100

Provide a JSON response ONLY (no markdown) with:
{
  "adjustment": <integer between -15 and +15>,
  "summary": "<2-3 sentence plain-English explanation of why this ranked the way it did, written in the voice of a premium financial intelligence platform — calm, precise, not salesy>",
  "reasons": ["<reason 1>", "<reason 2>", "<reason 3>", "<reason 4>", "<reason 5>"]
}`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 500,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    const data = await response.json()
    const text = data.content?.[0]?.text || '{}'
    const parsed = JSON.parse(text.replace(/```json|```/g, '').trim())
    return {
      adjustment: Math.max(-15, Math.min(15, parsed.adjustment || 0)),
      summary: parsed.summary || null,
      reasons: parsed.reasons || [],
    }
  } catch (e) {
    console.error('AI adjustment error:', e)
    return { adjustment: 0, summary: null, reasons: [] }
  }
}

export async function GET() {
  try {
    const { data: companies, error } = await supabase.from('companies').select('id, ticker, name, sector')
    if (error) throw error

    const results = []

    for (const company of companies) {
      const { data: trades } = await supabase
        .from('trades')
        .select('*')
        .eq('company_id', company.id)
        .order('transaction_date', { ascending: false })
        .limit(50)

      if (!trades || trades.length === 0) continue

      const buys = trades.filter(t => t.transaction_type === 'BUY' || t.transaction_type === 'P')
      if (buys.length === 0) continue

      const components = computeComponents(trades)
      const baseScore = computeRawScore(components)
      const { adjustment, summary, reasons } = await getAIAdjustment(company.ticker, components, trades)
      const finalScore = Math.max(0, Math.min(100, baseScore + adjustment))

      const rankingData = {
        ticker: company.ticker,
        score: finalScore,
        insider_conviction: components.insiderConviction,
        leadership_alignment: components.leadershipAlignment,
        historical_edge: components.historicalEdge,
        capital_commitment: components.capitalCommitment,
        ai_opportunity: components.aiOpportunity,
        ai_summary: summary,
        ai_reasons: reasons,
        updated_at: new Date().toISOString(),
      }

      const { error: upsertError } = await supabase
        .from('rankings')
        .upsert(rankingData, { onConflict: 'ticker' })

      if (!upsertError) results.push({ ticker: company.ticker, score: finalScore })
    }

    return NextResponse.json({ success: true, scored: results.length, results })
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
