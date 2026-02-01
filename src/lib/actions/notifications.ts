'use server'

import { createClient } from '@/lib/supabase/server'
import { upsertNotificationPreference } from '@/lib/supabase/notifications'
import { NotificationType, NOTIFICATION_TYPES } from '@/lib/types/notifications'

/**
 * Toggle a notification preference for the current user.
 * Validates the notification type and updates the preference.
 *
 * @param notificationType - The type of notification to toggle
 * @param enabled - Whether the notification should be enabled
 * @returns Success or error result
 */
export async function toggleNotificationPreference(
  notificationType: NotificationType,
  enabled: boolean
): Promise<{ success: boolean; error?: string }> {
  // Validate notification type
  if (!NOTIFICATION_TYPES.includes(notificationType)) {
    return { success: false, error: 'Invalid notification type' }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  try {
    await upsertNotificationPreference(supabase, user.id, notificationType, enabled)
    return { success: true }
  } catch (error) {
    console.error('Error toggling notification preference:', error)
    return { success: false, error: 'Failed to update preference' }
  }
}
