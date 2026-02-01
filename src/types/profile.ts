/**
 * Profile types aligned with database schema (snake_case)
 * Used for database operations and settings features
 */

export interface Profile {
  id: string
  username: string
  display_name: string | null
  avatar_url: string | null
  bio: string | null
  preferred_language: string
  is_moderator: boolean
  is_verified: boolean
  total_reviews: number
  total_helpful_votes: number
  created_at: string
  updated_at: string
}

export interface ProfileWithPrivacy extends Profile {
  is_private: boolean
  scheduled_deletion_at: string | null
}

// For display in UI (minimal info for other users to see)
export interface PublicProfile {
  id: string
  username: string
  display_name: string | null
  avatar_url: string | null
  bio: string | null
  total_reviews: number
  created_at: string
}
