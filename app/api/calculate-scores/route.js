import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

function scoreInsiderTitle(title = '') {
  const t = title.toLowerCase()
  if (t.includes('ceo') || t.includes('chief executive')) return 30
  if (t.includes('cfo') || t.includes('chief financial')) return 25
  if (t.includes('coo') || t.includes('chief operating')) return 20
  if (t.includes('president')) return 18
  if (t.includes('chief')) return 15
  if (t.includes('director')) return 10
  if (t.includes('vp') || t.includes('vice president')) return 8
  return 5
}

function scoreMultipleInsiders(buys = []) {
  const unique = new Set(buys.map(t => t.insider_id || t.insider_name)).size
  if (unique >= 5) return 20
  if (unique >= 3) return 12
  if (unique >= 2) return 6
  return 0
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
  const recentSells = allTrades.filter(t => t.transaction_type === 'SELL')
    .filter(t => {
      const d = new Date(t.transaction_date)
      const monthsAgo = (Date.now() - d.getTime()) / (1000 * 60 * 60 * 24 * 30)
      return monthsAgo <= 18
    })
  if (recentSells.length === 0) return 10
  if (recentSells.length <= 2) return 4
  return 0
}

function scoreRecency(transactionDate) {
  if (!transactionDate) return 0
  const days = (Date.now() - new Date(transactionDate).getTime()) / (1000 * 60 * 60 * 24)
  if (days <= 7) return 20
  if (days <= 30) return 12
  if (days <= 90) return 6
  if (days <= 180) return 2
  return 0
}

function scorePurchaseSize(value = 0) {
  if (value >= 10000000) return 40
  if (value >= 1000000) return 30
  if (value >= 500000) return 20
  if (value >= 100000) return 10
  if (value >= 50000) return 5
  return 0
}

// Compute the 5 component scores
function computeComponents(trades = []) {
  const buys = trades.filter(t => t.transaction_type === 'BUY' || t.transaction_type === 'P')
  const totalValue = buys.reduce((sum, t) => sum + (t.total_value || 0), 0)
  const topTrade = buys.sort((a, b) => (b.total_value || 0) - (a.total_value || 0))[0]

  // 1. Insider Conviction - quality of who is buying
  let insiderConviction = 0
  for (const t of buys) insiderConviction += scoreInsiderTitle(t.insider_title)
  insiderConviction = Math.min(Math.round(insiderConviction / Math.max(buys.length, 1) * 1.5), 100)

  // 2. Leadership Alignment - multiple seniors buying together
  let leadershipAlignment = scoreMultipleInsiders(buys) + scoreSamePeriod(buys)
  leadershipAlignment = Math.min(Math.round(leadershipAlignment * 2), 100)

  // 3. Historical Edge - pattern matching proxy (no selling + recency)
  const mostRecentDate = buys.map(t => t.transaction_date).sort().reverse()[0]
  let historicalEdge = scoreNoRecentSelling(trades) + scoreRecency(mostRecentDate)
  if (buys.length >= 3) historicalEdge += 15
  if (buys.length >= 5) historicalEdge += 10
  historicalEdge = Math.min(Math.round(historicalEdge * 3.5), 100)

  // 4. Capital Commitment - size of the bet
  let capitalCommitment = scorePurchaseSize(topTrade?.total_value || 0)
  const totalScore = scorePurchaseSize(totalValue)
  capitalCommitment = Math.min(Math.round((capitalCommitment + totalScore) * 2.5), 100)

  // 5. AI Opportunity Rating - composite of all signals
  const rawComposite = (insiderConviction + leadershipAlignment + historicalEdge + capitalCommitment)
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

export async function GET(request) {
  try {
    const { data: companies } = await supabase.from('companies').select('id, ticker, name')
    if (!companies?.length) return NextResponse.json({ error: 'No companies' }, { status: 400 })

    const results = []

    for (const company of companies) {
      const { data: trades } = await supabase
        .from('trades')
        .select('*')
        .eq('company_id', company.id)

      const components =