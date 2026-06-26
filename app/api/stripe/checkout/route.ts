import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2024-06-20',
  })

export async function POST(req: NextRequest) {
    try {
          const { email, plan } = await req.json()
          const priceId = plan === 'annual'
            ? process.env.STRIPE_PRICE_ANNUAL_ID
            : process.env.STRIPE_PRICE_MONTHLY_ID
          if (!priceId) return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
          const session = await stripe.checkout.sessions.create({
                  payment_method_types: ['card'],
                  mode: 'subscription',
                  customer_email: email || undefined,
                  line_items: [{ price: priceId, quantity: 1 }],
                  success_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/pricing?success=true`,
                  cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/pricing?cancelled=true`,
                  metadata: { plan },
                  subscription_data: { metadata: { plan } },
                })
          return NextResponse.json({ url: session.url })
        } catch (err: any) {
          return NextResponse.json({ error: err.message }, { status: 500 })
        }
  }
