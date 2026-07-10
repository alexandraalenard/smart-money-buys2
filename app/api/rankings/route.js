import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('confidence_score_breakdowns')
      .select(`
        score,
        ticker,
        companies (
          id,
          name,
          sector
        )
      `)
      .not('score', 'is', null)
      .order('score', { ascending: false })
      .limit(10)

    if (error) throw error

    const rankings = data.map((row, i) => ({
      id: row.companies?.id ?? i,
      ticker: row.ticker,
      name: row.companies?.name ?? row.ticker,
      sector: row.companies?.sector ?? '',
      rank: i + 1,
      ai_confidence_score: row.score,
    }))

    return Response.json({ rankings })

  } catch (err) {
    console.error('Rankings error:', err)
    return Response.json({ rankings: [], error: err.message }, { status: 500 })
  }
}