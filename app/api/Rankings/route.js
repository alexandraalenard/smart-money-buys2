import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('rankings')
      .select(`
        rank,
        ai_confidence_score,
        companies (
          id,
          ticker,
          name,
          sector
        )
      `)
      .order('rank', { ascending: true })
      .limit(10)

    if (error) throw error

    const rankings = data.map(row => ({
      id: row.companies.id,
      ticker: row.companies.ticker,
      name: row.companies.name,
      sector: row.companies.sector,
      rank: row.rank,
      ai_confidence_score: row.ai_confidence_score,
    }))

    return Response.json({ rankings })

  } catch (err) {
    console.error('Rankings error:', err)
    return Response.json({ rankings: [], error: err.message }, { status: 500 })
  }
}