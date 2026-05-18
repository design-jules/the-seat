import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
  try {
    const { sessionId } = await request.json()
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    if (session.payment_status === 'paid') {
      return NextResponse.json({ valid: true })
    }
    return NextResponse.json({ valid: false })
  } catch (error) {
    console.error('Verify payment error:', error)
    return NextResponse.json({ valid: false })
  }
}
