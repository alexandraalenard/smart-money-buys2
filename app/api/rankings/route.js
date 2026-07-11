import { createClient } from '@supabase/supabase-js'

// Run this route dynamically so rankings are fetched fresh on every request,
// and so the Supabase client is built at request time rather than at build time
// (building it at build time is what caused the earlier "supabaseUrl is required" crashes).
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )

    // 1. Get the top 10 scored companies from the `rankings` table.
    //    (Skip any row that has no score.)
    const { data: rankingRows, error: rankingError } = await supabase
      .from('rankings')
      .select('ticker, score, company_id, ai_summary')
      .not('score', 'is', null)
      .order('score', { ascending: false })
      .limit(10)

    if (rankingError) throw rankingError

    const rows = rankingRows ?? []

    // 2. Try to look up company names and sectors for those rankings.
    //    If the `companies` table isn't publicly readable yet, this just returns
    //    nothing and we fall back to showing the ticker as the name.
    const companyIds = rows.map((row) => row.company_id).filter(Boolean)
    let companyById = {}

    if (companyIds.length > 0) {
      const { data: companyRows } = await supabase
        .from('companies')
        .select('id, name, sector')
        .in('id', companyIds)

      companyById = Object.fromEntries(
        (companyRows ?? []).map((company) => [company.id, company])
      )
    }

    // 3. Shape the response exactly as the front-end expects it.
    const rankings = rows.map((row, index) => {
      const company = companyById[row.company_id]
      return {
        id: row.company_id ?? index,
        ticker: row.ticker,
        name: company?.name ?? row.ticker,
        sector: company?.sector ?? '',
        rank: index + 1,
        ai_confidence_score: Number(row.score),
        ai_summary: row.ai_summary ?? '',
      }
    })

    return Response.json({ rankings })
  } catch (err) {
    console.error('Rankings error:', err)
    return Response.json({ rankings: [], error: err.message }, { status: 500 })
  }
}