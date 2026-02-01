'use client'

import { useEffect, useMemo, useState } from 'react'
import { initZxcvbn, getPasswordStrength } from '@/lib/zxcvbn-setup'
import {
  getPasswordStrengthLabel,
  getPasswordStrengthColor,
} from '@/lib/validations/password'
import { useI18n } from '@/lib/i18n'

interface PasswordStrengthMeterProps {
  password: string
}

/**
 * Visual password strength indicator using zxcvbn.
 * Shows a progress bar with color-coded strength and feedback.
 */
export function PasswordStrengthMeter({ password }: PasswordStrengthMeterProps) {
  const { t } = useI18n()
  const [isInitialized, setIsInitialized] = useState(false)

  // Initialize zxcvbn once on mount
  useEffect(() => {
    initZxcvbn()
    setIsInitialized(true)
  }, [])

  // Compute strength from password
  const strength = useMemo(() => {
    if (!isInitialized || !password) {
      return null
    }
    return getPasswordStrength(password)
  }, [password, isInitialized])

  // Return null if password is empty
  if (!password || !strength) {
    return null
  }

  // Map score (0-4) to width percentage (20%-100%)
  const widthPercent = Math.max(20, (strength.score + 1) * 20)

  // Get bar color based on score
  const barColorClass =
    strength.score <= 1
      ? 'bg-red-500'
      : strength.score === 2
        ? 'bg-yellow-500'
        : 'bg-green-500'

  // Get text color
  const textColorClass = getPasswordStrengthColor(strength.score)

  // Get label based on score
  const labels = [
    t('password.strength.weak'),
    t('password.strength.fair'),
    t('password.strength.good'),
    t('password.strength.strong'),
    t('password.strength.veryStrong'),
  ]
  const label = labels[strength.score] || getPasswordStrengthLabel(strength.score)

  return (
    <div className="mt-2 space-y-2" role="region" aria-label={t('auth.password.label')}>
      {/* Progress bar */}
      <div className="space-y-1.5">
        <div
          className="h-2 w-full rounded-full bg-muted overflow-hidden"
          role="progressbar"
          aria-valuenow={strength.score}
          aria-valuemin={0}
          aria-valuemax={4}
          aria-label={`${t('auth.password.label')}: ${label}`}
        >
          <div
            className={`h-full rounded-full transition-all duration-300 ${barColorClass}`}
            style={{ width: `${widthPercent}%` }}
          />
        </div>

        {/* Strength label */}
        <div className="flex items-center justify-between">
          <span className={`text-xs font-medium ${textColorClass} transition-colors duration-300`}>
            {label}
          </span>
        </div>
      </div>

      {/* Feedback from zxcvbn */}
      {(strength.warning || strength.suggestions.length > 0) && (
        <div className="text-xs text-muted-foreground space-y-1">
          {strength.warning && (
            <p className="text-amber-600 dark:text-amber-400">{strength.warning}</p>
          )}
          {strength.suggestions.length > 0 && (
            <ul className="list-disc list-inside space-y-0.5">
              {strength.suggestions.map((suggestion, index) => (
                <li key={index}>{suggestion}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
