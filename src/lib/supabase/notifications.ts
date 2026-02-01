import { SupabaseClient } from '@supabase/supabase-js'
import {
  NotificationType,
  NOTIFICATION_TYPES,
} from '@/lib/types/notifications'

/**
 * Get notification preferences for a user.
 * Returns all notification types with defaults (all enabled) overridden by stored preferences.
 *
 * @param supabase - Supabase client instance
 * @param userId - The user's ID
 * @returns Record mapping each NotificationType to its enabled state
 */
export async function getNotificationPreferences(
  supabase: SupabaseClient,
  userId: string
): Promise<Record<NotificationType, boolean>> {
  const { data } = await supabase
    .from('user_notification_preferences')
    .select('notification_type, enabled')
    .eq('user_id', userId)

  // Default all to true, then override with stored preferences
  const preferences = Object.fromEntries(
    NOTIFICATION_TYPES.map((type) => [type, true])
  ) as Record<NotificationType, boolean>

  data?.forEach((pref) => {
    preferences[pref.notification_type as NotificationType] = pref.enabled
  })

  return preferences
}

/**
 * Upsert a notification preference for a user.
 * Uses ON CONFLICT to handle both insert and update cases.
 *
 * @param supabase - Supabase client instance
 * @param userId - The user's ID
 * @param notificationType - The type of notification
 * @param enabled - Whether the notification is enabled
 */
export async function upsertNotificationPreference(
  supabase: SupabaseClient,
  userId: string,
  notificationType: NotificationType,
  enabled: boolean
): Promise<void> {
  const { error } = await supabase
    .from('user_notification_preferences')
    .upsert(
      {
        user_id: userId,
        notification_type: notificationType,
        enabled,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'user_id,notification_type',
      }
    )

  if (error) throw error
}
