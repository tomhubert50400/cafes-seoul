import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Email verification confirmation route
 * Handles the callback from Supabase email verification links
 *
 * Email template should use:
 * {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type')
  const next = searchParams.get('next') ?? '/'

  const supabase = await createClient()

  // Check if user is already logged in and verified
  const { data: { user } } = await supabase.auth.getUser()
  if (user?.email_confirmed_at) {
    return NextResponse.redirect(new URL(next, request.url))
  }

  // If no token_hash or type, show error
  if (!token_hash || !type) {
    return NextResponse.redirect(
      new URL('/login?error=missing_verification_params', request.url)
    )
  }

  // Verify the OTP token
  const { error, data } = await supabase.auth.verifyOtp({
    type: type as 'email' | 'signup' | 'recovery' | 'invite',
    token_hash,
  })

  if (error) {
    // Token expired or already used (e.g. invalidated by a resend, or link clicked twice)
    if (error.code === 'otp_expired') {
      // Check if the email is actually confirmed despite the error
      // (can happen if user clicked the link twice, or Supabase pre-verified)
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      if (currentUser?.email_confirmed_at) {
        return NextResponse.redirect(new URL(next, request.url))
      }

      // Email is NOT verified - the link genuinely expired or was invalidated
      return NextResponse.redirect(
        new URL('/login?error=link_expired', request.url)
      )
    }

    // Generic verification error
    return NextResponse.redirect(
      new URL('/login?error=verification_failed', request.url)
    )
  }

  // Success! Check if we have a session now
  if (data?.session) {
    return NextResponse.redirect(new URL(next, request.url))
  }

  // Verification succeeded but no session (rare case)
  return NextResponse.redirect(
    new URL('/login?message=verified_login', request.url)
  )
}
