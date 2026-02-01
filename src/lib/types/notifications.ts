/**
 * Types of notifications that users can subscribe to.
 * Each type corresponds to a submission status change.
 */
export type NotificationType =
  | 'cafe_approved'
  | 'cafe_rejected'
  | 'photo_approved'
  | 'photo_rejected'

/**
 * Array of all notification types for iteration and validation.
 */
export const NOTIFICATION_TYPES: NotificationType[] = [
  'cafe_approved',
  'cafe_rejected',
  'photo_approved',
  'photo_rejected',
]

/**
 * A single notification preference as stored in the database.
 */
export interface NotificationPreference {
  notification_type: NotificationType
  enabled: boolean
  updated_at: string
}

/**
 * User's notification preferences as a flat state object.
 * Useful for forms and UI state management.
 */
export interface NotificationPreferencesState {
  cafe_approved: boolean
  cafe_rejected: boolean
  photo_approved: boolean
  photo_rejected: boolean
}

/**
 * Default notification preferences (all enabled).
 * New users start with opt-out model.
 */
export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferencesState = {
  cafe_approved: true,
  cafe_rejected: true,
  photo_approved: true,
  photo_rejected: true,
}
