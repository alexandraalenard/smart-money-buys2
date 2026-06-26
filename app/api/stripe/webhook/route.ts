import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2024-06-20' })
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  )

export async function POST(req: NextRequest) {
    const body = await req.text()
    const sig = req.headers.get('stripe-signature') || ''
    let event: Stripe.Event
    try {
          event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET || '')
        } catch (err: any) {
          return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 })
        }
    if (event.type === 'checkout.session.completed') {
          const session = event.data.object as Stripe.Checkout.Session
          const email = session.customer_email
          const plan = session.metadata?.plan || 'monthly'
          if (email) {
                  await supabase.from('subscribers').upsert({
                            email, plan, status: 'active',
                            stripe_customer_id: session.customer as string,
                            stripe_subscription_id: session.subscription as string,
                            alert_massive_trades: true,
                            alert_billionaire_trades: true,
                            alert_high_confidence: true,
                            created_at: new Date().toISOString(),
                          }, { onConflict: 'email' })
                }
        }
    if (event.type === 'customer.subscription.deleted') {
          const sub = event.data.object as Stripe.Subscription
          await supabase.from('subscribers').update({ status: 'cancelled' }).eq('stripe_subscription_id', sub.id)
        }
    return NextResponse.json({ received: true })
  }
