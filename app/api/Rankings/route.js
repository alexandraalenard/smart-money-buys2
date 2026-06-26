import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('companies')
      .select('id, ticker, name, sector, ai_confidence_score')
      .not('ai_confidence_score', 'is', null)
      .order('ai_confidence_score', { ascending: false })
      .limit(10)

    if (error) throw error

    const rankings = data.map((company, i) => ({
      id: company.id,
      ticker: company.ticker,
      name: company.name,
      sector: company.sector,
      rank: i + 1,
      ai_confidence_score: company.ai_confidence_score,
    }))

    return Response.json({ rankings })

  } catch (err) {
    console.error('Rankings error:', err)
    return Response.json({ rankings: [], error: err.message }, { status: 500 })
  }
}