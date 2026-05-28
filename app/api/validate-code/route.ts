import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json()
    if (!code) return NextResponse.json({ valid: false })

    const supabase = createClient()

    // Look up the code — include email so we can check if it's already claimed
    const { data, error } = await supabase
      .from('access_codes')
      .select('id, email')
      .eq('code', code.trim().toUpperCase())
      .single()

    if (error || !data) {
      return NextResponse.json({ valid: false, message: "That code didn't work. Try again?" })
    }

    const { data: { user } } = await supabase.auth.getUser()

    // Code is already claimed — check if it belongs to this user
    if (data.email) {
      if (!user || user.email !== data.email) {
        return NextResponse.json({
          valid: false,
          message: 'This code has already been claimed by another account.',
        })
      }
      // Same user re-entering their own code — just re-approve and move on
      await supabase
        .from('approved_users')
        .upsert({ user_id: user.id, approved_via: 'code' }, { onConflict: 'user_id' })
      return NextResponse.json({ valid: true })
    }

    // Code is unclaimed — require a logged-in account to activate it
    if (!user) {
      return NextResponse.json({
        valid: false,
        requiresLogin: true,
        message: 'Sign in first — codes are tied to your account so only you can use it.',
      })
    }

    // Claim the code to this user and grant permanent access
    await supabase
      .from('access_codes')
      .update({ email: user.email, used_at: new Date().toISOString() })
      .eq('id', data.id)

    await supabase
      .from('approved_users')
      .upsert({ user_id: user.id, approved_via: 'code' }, { onConflict: 'user_id' })

    return NextResponse.json({ valid: true })
  } catch (error) {
    console.error('Validate code error:', error)
    return NextResponse.json({ valid: false, message: 'Something went wrong.' })
  }
}
