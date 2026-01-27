import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type')

  if (token_hash && type) {
    const supabase = await createClient()
    const { error } = await supabase.auth.verifyOtp({
      type: type as 'email' | 'signup',
      token_hash,
    })

    if (!error) {
      // Auto-login successful - redirect to home
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  // Error - redirect to login with error message
  return NextResponse.redirect(
    new URL('/login?error=Unable to verify email', request.url)
  )
}
