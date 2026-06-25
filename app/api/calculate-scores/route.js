import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function GET() {
  try {
    const { data: trades } = await supabase
      .from('trades')
      .select(`*, companies(*), insiders(*)`)
      .eq('trade_type', 'buy')
      .order('trade_date', { ascending: false })

    if (!trades || trades.length === 0) {
      return Response.json({ success: true, message: 'No trades to score yet' })
    }

    const companyScores = {}

    for (const trade of trades) {
      const companyId = trade.company_id
      if (!companyScores[companyId]) {
        companyScores[companyId] = {
          company_id: companyId,
          totalValue: 0,
          tradeCount: 0,
          insiders: new Set(),
          reasons: []
        }
      }

      const score = companyScores[companyId]
      score.totalValue += trade.total_value || 0
      score.tradeCount++
      score.insiders.add(trade.insider_id)
    }

    for (const companyId in companyScores) {
      const data = companyScores[companyId]
      let score = 0
      const reasons = []

      if (data.totalValue > 1000000) { score += 30; reasons.push('Large purchase over $1M') }
      else if (data.totalValue > 500000) { score += 20; reasons.push('Significant purchase over $500K') }
      else if (data.totalValue > 100000) { score += 10; reasons.push('Notable purchase over $100K') }

      if (data.insiders.size > 2) { score += 30; reasons.push('Multiple insiders buying') }
      else if (data.insiders.size > 1) { score += 20; reasons.push('Two insiders buying') }
      else { score += 5 }

      if (data.tradeCount > 5) { score += 20; reasons.push('High frequency buying') }
      else if (data.tradeCount > 2) { score += 10; reasons.push('Repeated buying') }

      score = Math.min(score, 100)

      await supabase.from('rankings').upsert({
        company_id: companyId,
        score: score,
        reason: reasons.join('. '),
        ranked_at: new Date().toISOString()
      }, { onConflict: 'company_id' })
    }

    return Response.json({
      success: true,
      message: `Scored ${Object.keys(companyScores).length} companies`,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 })
  }
}