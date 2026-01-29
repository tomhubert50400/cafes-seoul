import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Email verification confirmation route
 * Handles the callback from Supabase email verification links
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type')
  const next = searchParams.get('next') ?? '/'

  // Check if user is already logged in and verified
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  // If user is already logged in and email is confirmed, just redirect to home
  if (user?.email_confirmed_at) {
    console.log('User already verified, redirecting to home')
    return NextResponse.redirect(new URL(next, request.url))
  }

  // If no token_hash or type, show error
  if (!token_hash || !type) {
    console.error('Missing token_hash or type in verification URL')
    console.error('Search params:', Object.fromEntries(searchParams.entries()))
    return NextResponse.redirect(
      new URL('/login?error=missing_verification_params', request.url)
    )
  }

  // Verify the OTP token
  const { error, data } = await supabase.auth.verifyOtp({
    type: type as 'email' | 'signup' | 'recovery' | 'invite',
    token_hash,
  })

  // Handle specific error cases
  if (error) {
    console.error('Email verification error:', error.message)
    console.error('Error code:', error.code)
    console.error('Error status:', error.status)

    // Check if the error is because email is already verified
    if (error.message?.includes('already') || error.code === 'otp_expired') {
      // Try to get current user status
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session?.user?.email_confirmed_at) {
        // User is actually verified, just redirect to home
        console.log('User verified despite error, redirecting to home')
        return NextResponse.redirect(new URL('/', request.url))
      }

      // Email might be verified but session expired - let them try logging in
      return NextResponse.redirect(
        new URL('/login?message=already_verified', request.url)
      )
    }

    // User not found error
    if (error.message?.includes('User not found') || error.code === 'user_not_found') {
      return NextResponse.redirect(
        new URL('/login?error=user_not_found', request.url)
      )
    }

    // Generic verification error
    return NextResponse.redirect(
      new URL('/login?error=verification_failed', request.url)
    )
  }

  // Success! Check if we have a session now
  if (data?.session) {
    console.log('Email verified successfully, user logged in')
    // User is now logged in, redirect to home
    return NextResponse.redirect(new URL(next, request.url))
  }

  // Verification succeeded but no session (rare case)
  console.log('Email verified but no session, redirecting to login')
  return NextResponse.redirect(
    new URL('/login?message=verified_login', request.url)
  )
}
