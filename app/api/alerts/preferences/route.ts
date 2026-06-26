import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    )

    // GET: fetch subscriber alert preferences by email
    export async function GET(req: NextRequest) {
      const email = req.nextUrl.searchParams.get('email')
        if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 })
          const { data, error } = await supabase
              .from('subscribers')
                  .select('email, alert_massive_trades, alert_billionaire_trades, alert_high_confidence, status')
                      .eq('email', email)
                          .single()
                            if (error) return NextResponse.json({ error: error.message }, { status: 404 })
                              return NextResponse.json(data)
                              }

                              // PATCH: update subscriber alert preferences
                              export async function PATCH(req: NextRequest) {
                                const { email, alert_massive_trades, alert_billionaire_trades, alert_high_confidence } = await req.json()
                                  if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 })
                                    const updates: Record<string, boolean> = {}
                                      if (typeof alert_massive_trades === 'boolean') updates.alert_massive_trades = alert_massive_trades
                                        if (typeof alert_billionaire_trades === 'boolean') updates.alert_billionaire_trades = alert_billionaire_trades
                                          if (typeof alert_high_confidence === 'boolean') updates.alert_high_confidence = alert_high_confidence
                                            const { data, error } = await supabase
                                                .from('subscribers')
                                                    .update(updates)
                                                        .eq('email', email)
                                                            .select()
                                                                .single()
                                                                  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
                                                                    return NextResponse.json(data)
                                                                    }
