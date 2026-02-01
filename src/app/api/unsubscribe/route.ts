// Unsubscribe API route - handles one-click unsubscribe from email notifications
// Supports both GET (link clicks) and POST (RFC 8058 one-click)

import { createServiceRoleClient } from '@/lib/supabase/server'
import { verifyUnsubscribeToken } from '@/lib/email/unsubscribe'
import { NextRequest, NextResponse } from 'next/server'

async function handleUnsubscribe(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token')

  if (!token) {
    return NextResponse.redirect(new URL('/unsubscribe-error?reason=missing', request.url))
  }

  const payload = await verifyUnsubscribeToken(token)
  if (!payload) {
    return NextResponse.redirect(new URL('/unsubscribe-error?reason=invalid', request.url))
  }

  // Use service role to update preferences (user not logged in)
  const supabase = createServiceRoleClient()

  // Disable all notification types for this user
  const notificationTypes = ['cafe_approved', 'cafe_rejected', 'photo_approved', 'photo_rejected']

  for (const type of notificationTypes) {
    const { error } = await supabase
      .from('user_notification_preferences')
      .upsert({
        user_id: payload.userId,
        notification_type: type,
        enabled: false,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,notification_type'
      })

    if (error) {
      console.error(`Failed to disable ${type}:`, error)
    }
  }

  return NextResponse.redirect(new URL('/unsubscribe-success', request.url))
}

// GET handler for link clicks
export async function GET(request: NextRequest) {
  return handleUnsubscribe(request)
}

// POST handler for RFC 8058 one-click unsubscribe
export async function POST(request: NextRequest) {
  return handleUnsubscribe(request)
}
