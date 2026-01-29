'use client'

import { useEffect, useState } from 'react'
import { useDebouncedValue } from '@/lib/hooks/use-debounced-value'
import { Check, X, Circle } from 'lucide-react'

interface PasswordStrengthMeterProps {
  password: string
  t: (key: string) => string
}

type StrengthLevel = 'weak' | 'fair' | 'good' | 'strong'

interface StrengthResult {
  score: number
  level: StrengthLevel
  criteria: {
    length: boolean
    uppercase: boolean
    lowercase: boolean
    number: boolean
    special: boolean
  }
}

function calculateStrength(password: string): StrengthResult {
  let score = 0
  const criteria = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
  }

  // Length scoring
  if (password.length >= 12) {
    score += 40
  } else if (password.length >= 8) {
    score += 30
  } else if (password.length >= 6) {
    score += 15
  }

  // Character type scoring
  if (criteria.uppercase) score += 10
  if (criteria.lowercase) score += 10
  if (criteria.number) score += 15
  if (criteria.special) score += 15

  // Mixed variety bonus
  const charTypes = [
    criteria.uppercase,
    criteria.lowercase,
    criteria.number,
    criteria.special,
  ].filter(Boolean).length
  if (charTypes >= 3) score += 10

  // Cap at 100
  score = Math.min(100, score)

  // Determine level
  let level: StrengthLevel
  if (score <= 40) {
    level = 'weak'
  } else if (score <= 70) {
    level = 'fair'
  } else if (score <= 90) {
    level = 'good'
  } else {
    level = 'strong'
  }

  return { score, level, criteria }
}

export function PasswordStrengthMeter({ password, t }: PasswordStrengthMeterProps) {
  const debouncedPassword = useDebouncedValue(password, 300)
  const [strength, setStrength] = useState<StrengthResult>({
    score: 0,
    level: 'weak',
    criteria: {
      length: false,
      uppercase: false,
      lowercase: false,
      number: false,
      special: false,
    },
  })

  useEffect(() => {
    if (debouncedPassword) {
      setStrength(calculateStrength(debouncedPassword))
    } else {
      setStrength({
        score: 0,
        level: 'weak',
        criteria: {
          length: false,
          uppercase: false,
          lowercase: false,
          number: false,
          special: false,
        },
      })
    }
  }, [debouncedPassword])

  // Color and label based on level
  const levelConfig = {
    weak: { color: 'bg-red-500', textColor: 'text-red-500', label: t('auth.password.strength.weak') },
    fair: { color: 'bg-orange-500', textColor: 'text-orange-500', label: t('auth.password.strength.fair') },
    good: { color: 'bg-blue-500', textColor: 'text-blue-500', label: t('auth.password.strength.good') },
    strong: { color: 'bg-green-500', textColor: 'text-green-500', label: t('auth.password.strength.strong') },
  }

  const config = levelConfig[strength.level]

  // Calculate filled segments (0-4)
  const filledSegments = Math.min(4, Math.ceil(strength.score / 25))

  return (
    <div className="mt-2 space-y-3" role="region" aria-label={t('auth.password.label')}>
      {/* Segmented progress bar */}
      <div className="space-y-2">
        <div
          className="flex gap-1 h-2"
          role="progressbar"
          aria-valuenow={strength.score}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${t('auth.password.label')}: ${config.label}`}
        >
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className={`flex-1 rounded-full transition-all duration-300 ease-out ${
                i < filledSegments ? config.color : 'bg-muted'
              }`}
            />
          ))}
        </div>

        {/* Strength label */}
        <div className="flex items-center justify-between">
          <span className={`text-xs font-medium ${config.textColor} transition-colors duration-300`}>
            {config.label}
          </span>
          <span className="text-xs text-muted-foreground">
            {t('auth.password.hint')}
          </span>
        </div>
      </div>

      {/* Criteria checklist */}
      <div className="space-y-1.5 pt-1">
        <CriteriaItem
          met={strength.criteria.length}
          label={t('auth.password.criteria.length')}
        />
        <CriteriaItem
          met={strength.criteria.uppercase}
          label={t('auth.password.criteria.uppercase')}
        />
        <CriteriaItem
          met={strength.criteria.lowercase}
          label={t('auth.password.criteria.lowercase')}
        />
        <CriteriaItem
          met={strength.criteria.number}
          label={t('auth.password.criteria.number')}
        />
        <CriteriaItem
          met={strength.criteria.special}
          label={t('auth.password.criteria.special')}
        />
      </div>
    </div>
  )
}

interface CriteriaItemProps {
  met: boolean
  label: string
}

function CriteriaItem({ met, label }: CriteriaItemProps) {
  return (
    <div className="flex items-center gap-2 text-xs">
      {met ? (
        <Check className="h-3.5 w-3.5 text-green-500" aria-hidden="true" />
      ) : (
        <Circle className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
      )}
      <span className={met ? 'text-foreground' : 'text-muted-foreground'}>
        {label}
      </span>
    </div>
  )
}
