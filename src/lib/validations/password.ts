import { z } from 'zod'
import { getPasswordStrength, type PasswordStrengthResult } from '@/lib/zxcvbn-setup'

/** Minimum password length */
export const PASSWORD_MIN_LENGTH = 8

/** Minimum password score (0-4). Score 2 = "Good" (somewhat guessable) */
export const PASSWORD_MIN_SCORE = 2

/**
 * Zod schema for password validation.
 * Requires minimum length and minimum strength score.
 */
export const passwordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters`)
  .refine(
    (password) => {
      const result = getPasswordStrength(password)
      return result.score >= PASSWORD_MIN_SCORE
    },
    {
      message: 'Password is too weak. Try adding more characters or mixing letters, numbers, and symbols.',
    }
  )

/**
 * Validate password strength for real-time UI feedback.
 * Returns the full strength result including score and suggestions.
 *
 * @param password - The password to evaluate
 * @returns Password strength result with score 0-4 and feedback
 */
export function validatePasswordStrength(password: string): PasswordStrengthResult {
  return getPasswordStrength(password)
}

/**
 * Get a human-readable label for the password strength score.
 */
export function getPasswordStrengthLabel(score: 0 | 1 | 2 | 3 | 4): string {
  const labels = ['Weak', 'Fair', 'Good', 'Strong', 'Very Strong']
  return labels[score]
}

/**
 * Get the color class for the password strength score.
 */
export function getPasswordStrengthColor(score: 0 | 1 | 2 | 3 | 4): string {
  const colors = [
    'text-red-600', // 0: Weak
    'text-orange-500', // 1: Fair
    'text-yellow-600', // 2: Good
    'text-lime-600', // 3: Strong
    'text-green-600', // 4: Very Strong
  ]
  return colors[score]
}

export type { PasswordStrengthResult }
