import { createClient } from '@supabase/supabase-js'

// Service role client — server-side only, never expose to browser
// Bypasses RLS and can read auth.users
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
