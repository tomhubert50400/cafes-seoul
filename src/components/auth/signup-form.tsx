'use client'

import { useState, useEffect, useActionState, useRef } from 'react'
import { useFormStatus } from 'react-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff } from 'lucide-react'
import { signup } from '@/app/actions/auth'
import { createSignupSchema, type SignupInput } from '@/lib/validations/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PasswordStrengthMeter } from '@/components/auth/password-strength-meter'
import { useI18n } from '@/lib/i18n'
import { OAuthButtons } from '@/components/auth/oauth-buttons'

function SubmitButton({ isValid }: { isValid: boolean }) {
  const { pending } = useFormStatus()
  const { t } = useI18n()

  return (
    <Button type="submit" className="w-full" disabled={pending || !isValid}>
      {pending ? t('auth.signup.submitting') : t('auth.signup.submit')}
    </Button>
  )
}

interface SignupFormProps {
  oauthError?: string
}

export function SignupForm({ oauthError }: SignupFormProps) {
  const { t } = useI18n()
  const [showPassword, setShowPassword] = useState(false)
  const [state, formAction] = useActionState(signup, null)
  const [touchedFields, setTouchedFields] = useState({ email: false, password: false })
  const emailInputRef = useRef<HTMLInputElement>(null)

  const {
    register,
    formState: { errors, isValid },
    setError,
    clearErrors,
    trigger,
    watch,
  } = useForm<SignupInput>({
    resolver: zodResolver(createSignupSchema(t)),
    mode: 'onBlur',
  })

  // Watch password for strength meter
  const password = watch('password', '')

  // Handle server-side errors
  useEffect(() => {
    if (state?.errors) {
      Object.entries(state.errors).forEach(([field, messages]) => {
        const messageArray = messages as string[]
        setError(field as keyof SignupInput, {
          type: 'server',
          message: messageArray[0],
        })
      })
      
      // Focus the first invalid field (email first, then password)
      setTimeout(() => {
        if (state.errors?.email && emailInputRef.current) {
          emailInputRef.current.focus()
        }
      }, 0)
    }
  }, [state?.errors, setError])

  return (
    <form action={formAction} className="space-y-4">
      {/* OAuth error from URL */}
      {oauthError && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {oauthError}
        </div>
      )}

      {/* Email field */}
      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium">
          {t('auth.form.email')}
        </label>
        <Input
          id="email"
          type="email"
          placeholder={t('auth.form.emailPlaceholder')}
          {...register('email', {
            onChange: () => {
              // Clear error immediately when user types, if field was touched
              if (touchedFields.email && errors.email) {
                clearErrors('email')
              }
            },
            onBlur: async () => {
              setTouchedFields(prev => ({ ...prev, email: true }))
              await trigger('email')
            },
          })}
          ref={(el) => {
            // Merge react-hook-form ref with our focus ref
            if (el) {
              emailInputRef.current = el
            }
          }}
          aria-invalid={errors.email ? 'true' : 'false'}
        />
        {errors.email && (
          <p className="text-sm text-destructive">{errors.email.message}</p>
        )}
      </div>

      {/* Password field */}
      <div className="space-y-2">
        <label htmlFor="password" className="text-sm font-medium">
          {t('auth.form.password')}
        </label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder={t('auth.form.passwordCreatePlaceholder')}
            {...register('password', {
              onChange: () => {
                // Clear error immediately when user types, if field was touched
                if (touchedFields.password && errors.password) {
                  clearErrors('password')
                }
              },
              onBlur: async () => {
                setTouchedFields(prev => ({ ...prev, password: true }))
                await trigger('password')
              },
            })}
            aria-invalid={errors.password ? 'true' : 'false'}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label={showPassword ? t('auth.form.hidePassword') : t('auth.form.showPassword')}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
        {errors.password && (
          <p className="text-sm text-destructive">{errors.password.message}</p>
        )}
        {/* Password strength meter */}
        <PasswordStrengthMeter password={password} />
      </div>

      {/* Server error message */}
      {state?.message && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {state.message}
        </div>
      )}

      {/* Submit button */}
      <SubmitButton isValid={isValid} />

      {/* OAuth buttons */}
      <OAuthButtons />
    </form>
  )
}
