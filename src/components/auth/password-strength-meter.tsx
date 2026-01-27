'use client'

import { useEffect, useState } from 'react'
import { zxcvbn } from '@zxcvbn-ts/core'
import { useDebouncedValue } from '@/lib/hooks/use-debounced-value'
import { useI18n } from '@/lib/i18n'

export function PasswordStrengthMeter({ password }: { password: string }) {
  const { t } = useI18n()
  const debouncedPassword = useDebouncedValue(password, 300)
  const [strength, setStrength] = useState(0)

  useEffect(() => {
    if (debouncedPassword) {
      const result = zxcvbn(debouncedPassword)
      setStrength(result.score)
    } else {
      setStrength(0)
    }
  }, [debouncedPassword])

  if (!password) return null

  const colors = [
    'bg-red-500',
    'bg-red-500',
    'bg-yellow-500',
    'bg-blue-500',
    'bg-green-500',
  ]
  const labels = [
    t('auth.password.weak'),
    t('auth.password.weak'),
    t('auth.password.fair'),
    t('auth.password.good'),
    t('auth.password.strong'),
  ]

  return (
    <div className="mt-2">
      <div className="flex gap-1 h-1">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className={`flex-1 rounded ${
              i <= strength ? colors[strength] : 'bg-muted'
            }`}
          />
        ))}
      </div>
      <p className="text-xs text-muted-foreground mt-1">{labels[strength]}</p>
    </div>
  )
}
