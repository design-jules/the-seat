import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
  try {
    const { sessionId } = await request.json()
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    if (session.payment_status === 'paid') {
      // If user is signed in, save them as permanently approved
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase
          .from('approved_users')
          .upsert({ user_id: user.id, approved_via: 'paid' }, { onConflict: 'user_id' })
      }
      return NextResponse.json({ valid: true })
    }
    return NextResponse.json({ valid: false })
  } catch (error) {
    console.error('Verify payment error:', error)
    return NextResponse.json({ valid: false })
  }
}
