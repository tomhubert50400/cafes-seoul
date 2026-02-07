import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { generateDigestEmail } from './email-templates'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

Deno.serve(async (req) => {
  // Initialize Supabase client with service role
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  // 1. Query all unsent notifications
  const { data: notifications, error } = await supabase
    .from('pending_email_notifications')
    .select('id, user_id, notification_type, submission_type, cafe_name, cafe_slug, rejection_reason, created_at')
    .is('sent_at', null)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Query error:', error)
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }

  if (!notifications?.length) {
    return new Response(JSON.stringify({ sent: 0, message: 'No pending notifications' }), {
      headers: { 'Content-Type': 'application/json' }
    })
  }

  // 2. Group notifications by user_id
  const byUser = notifications.reduce((acc, n) => {
    if (!acc[n.user_id]) acc[n.user_id] = []
    acc[n.user_id].push(n)
    return acc
  }, {} as Record<string, typeof notifications>)

  let sentCount = 0
  const processedIds: string[] = []
  const baseUrl = 'https://cafes-seoul.com' // TODO: Make configurable

  // 3. Process each user
  for (const [userId, userNotifications] of Object.entries(byUser)) {
    // Get user profile (email and language preference)
    const { data: user } = await supabase.auth.admin.getUserById(userId)
    if (!user?.user?.email) {
      // Mark as processed even without email
      processedIds.push(...userNotifications.map(n => n.id))
      continue
    }

    // Get preferred language from profiles
    const { data: profile } = await supabase
      .from('profiles')
      .select('preferred_language')
      .eq('id', userId)
      .single()

    const language = profile?.preferred_language || 'en'

    // Check notification preferences
    const { data: prefs } = await supabase
      .from('user_notification_preferences')
      .select('notification_type, enabled')
      .eq('user_id', userId)

    // Build set of enabled notification types
    const enabledTypes = new Set<string>()
    const prefsMap = new Map(prefs?.map(p => [p.notification_type, p.enabled]) ?? [])

    // Default to enabled if no preference set (opt-out model)
    for (const n of userNotifications) {
      const pref = prefsMap.get(n.notification_type)
      if (pref === undefined || pref === true) {
        enabledTypes.add(n.notification_type)
      }
    }

    // Filter notifications by preferences
    const toSend = userNotifications.filter(n => enabledTypes.has(n.notification_type))

    // Mark all as processed (even filtered ones)
    processedIds.push(...userNotifications.map(n => n.id))

    if (!toSend.length) continue

    // Generate email content
    const { html, text, subject } = await generateDigestEmail(
      toSend,
      language,
      userId,
      baseUrl
    )

    // Send via Resend
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: 'Cafes Seoul <notifications@cafes-seoul.com>',
        to: [user.user.email],
        subject,
        html,
        text,
        headers: {
          'List-Unsubscribe': `<${baseUrl}/api/unsubscribe?token=TOKEN>`,
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click'
        }
      })
    })

    if (res.ok) {
      sentCount++
    } else {
      const err = await res.json()
      console.error(`Failed to send to ${user.user.email}:`, err)
    }
  }

  // 4. Mark all processed notifications as sent
  if (processedIds.length) {
    await supabase
      .from('pending_email_notifications')
      .update({ sent_at: new Date().toISOString() })
      .in('id', processedIds)
  }

  return new Response(JSON.stringify({
    sent: sentCount,
    processed: processedIds.length
  }), {
    headers: { 'Content-Type': 'application/json' }
  })
})
