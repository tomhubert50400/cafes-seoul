'use server'

import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { passwordSchema } from '@/lib/validations/password'
import { initZxcvbn } from '@/lib/zxcvbn-setup'

// Initialize zxcvbn for server-side validation
initZxcvbn()

const emailSchema = z.string().email('Invalid email address')

type PasswordResetResult = {
  success: boolean
}

type UpdatePasswordResult =
  | { success: true }
  | { success: false; error: { password: string[] } }

/**
 * Request a password reset email.
 * ALWAYS returns success to prevent email enumeration attacks.
 *
 * @param email - The email address to send the reset link to
 */
export async function requestPasswordReset(
  email: string
): Promise<PasswordResetResult> {
  // Validate email format
  const parsed = emailSchema.safeParse(email)
  if (!parsed.success) {
    // Still return success to prevent enumeration
    return { success: true }
  }

  const supabase = await createClient()

  // Attempt to send reset email
  // Supabase will silently succeed if email doesn't exist
  await supabase.auth.resetPasswordForEmail(parsed.data, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password`,
  })

  // ALWAYS return success to prevent email enumeration
  return { success: true }
}

/**
 * Update the user's password after clicking the reset link.
 * Requires an active session (established by the reset link).
 * Signs out all sessions globally after successful update.
 *
 * @param newPassword - The new password to set
 */
export async function updatePassword(
  newPassword: string
): Promise<UpdatePasswordResult> {
  // Validate password with zxcvbn strength check
  const parsed = passwordSchema.safeParse(newPassword)
  if (!parsed.success) {
    const messages = parsed.error.issues.map((issue) => issue.message)
    return {
      success: false,
      error: { password: messages },
    }
  }

  const supabase = await createClient()

  // Update the password
  const { error } = await supabase.auth.updateUser({
    password: parsed.data,
  })

  if (error) {
    return {
      success: false,
      error: { password: [error.message || 'Failed to update password'] },
    }
  }

  // Sign out globally to terminate all sessions
  // This forces re-authentication with the new password
  await supabase.auth.signOut({ scope: 'global' })

  return { success: true }
}
