import { createClient } from '@/lib/supabase/server';
import { NextResponse, NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  // Handle provider errors
  if (error) {
    // User cancelled the login
    if (error === 'access_denied') {
      return NextResponse.redirect(
        new URL('/login?error=Login cancelled', request.url)
      );
    }

    // Other errors
    const message = errorDescription || 'OAuth authentication failed';
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(message)}`, request.url)
    );
  }

  // No code and no error - invalid callback
  if (!code) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Exchange code for session
  const supabase = await createClient();
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError) {
    let message = 'OAuth authentication failed';

    // Map specific error codes to user-friendly messages
    if (exchangeError.message?.includes('flow_state_expired')) {
      message = 'Login took too long. Please try again.';
    } else if (exchangeError.message?.includes('bad_oauth_state')) {
      message = 'Login session expired. Please try again.';
    }

    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(message)}`, request.url)
    );
  }

  // Success - redirect to next URL (validated to prevent open redirect)
  const redirectUrl = next?.startsWith('/') ? next : '/';
  return NextResponse.redirect(new URL(redirectUrl, request.url));
}
