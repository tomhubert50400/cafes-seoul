import { SupabaseClient } from '@supabase/supabase-js'

/**
 * Check if the current user has password-based authentication.
 * Users who signed up with email/password have 'email' as their provider.
 * OAuth users (Google, etc.) will not have 'email' provider.
 */
export async function hasPasswordAuth(
  supabase: SupabaseClient
): Promise<boolean> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return false

  // Check if user has email provider in their identities
  // identities array contains objects with provider field
  const hasEmailIdentity = user.identities?.some(
    (identity) => identity.provider === 'email'
  )

  return hasEmailIdentity ?? false
}

/**
 * Get the current user's email address.
 * Returns null if user is not authenticated.
 */
export async function getUserEmail(
  supabase: SupabaseClient
): Promise<string | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return user?.email ?? null
}
