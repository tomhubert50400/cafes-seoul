import { zxcvbn, zxcvbnOptions, type ZxcvbnResult } from '@zxcvbn-ts/core'
import * as zxcvbnCommonPackage from '@zxcvbn-ts/language-common'
import * as zxcvbnEnPackage from '@zxcvbn-ts/language-en'

let isInitialized = false

/**
 * Initialize zxcvbn with language dictionaries.
 * Must be called once before using getPasswordStrength.
 * Safe to call multiple times (idempotent).
 */
export function initZxcvbn(): void {
  if (isInitialized) return

  const options = {
    translations: zxcvbnEnPackage.translations,
    graphs: zxcvbnCommonPackage.adjacencyGraphs,
    dictionary: {
      ...zxcvbnCommonPackage.dictionary,
      ...zxcvbnEnPackage.dictionary,
    },
  }
  zxcvbnOptions.setOptions(options)
  isInitialized = true
}

export interface PasswordStrengthResult {
  /** Score from 0-4: 0=weak, 1=fair, 2=good, 3=strong, 4=very strong */
  score: 0 | 1 | 2 | 3 | 4
  /** Warning message about the password */
  warning: string
  /** Suggestions to improve the password */
  suggestions: string[]
}

/**
 * Get password strength using zxcvbn.
 * Automatically initializes zxcvbn if not already done.
 *
 * @param password - The password to evaluate
 * @returns Password strength result with score and feedback
 */
export function getPasswordStrength(password: string): PasswordStrengthResult {
  // Auto-initialize if needed
  if (!isInitialized) {
    initZxcvbn()
  }

  const result: ZxcvbnResult = zxcvbn(password)

  return {
    score: result.score as 0 | 1 | 2 | 3 | 4,
    warning: result.feedback.warning || '',
    suggestions: result.feedback.suggestions || [],
  }
}
