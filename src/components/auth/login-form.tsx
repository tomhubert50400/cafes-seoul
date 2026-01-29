'use client'

import { useState, useEffect, useActionState, useRef } from 'react'
import { useFormStatus } from 'react-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff } from 'lucide-react'
import { login, resendVerification } from '@/app/actions/auth'
import { createLoginSchema, type LoginInput } from '@/lib/validations/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { useI18n } from '@/lib/i18n'
import { OAuthButtons } from '@/components/auth/oauth-buttons'

function SubmitButton({ isValid }: { isValid: boolean }) {
  const { pending } = useFormStatus()
  const { t } = useI18n()

  return (
    <Button type="submit" className="w-full" disabled={pending || !isValid}>
      {pending ? t('auth.login.submitting') : t('auth.login.submit')}
    </Button>
  )
}

interface LoginFormProps {
  oauthError?: string
}

export function LoginForm({ oauthError }: LoginFormProps) {
  const { t } = useI18n()
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [state, formAction] = useActionState(login, null)
  const [touchedFields, setTouchedFields] = useState({ email: false, password: false })
  const emailInputRef = useRef<HTMLInputElement>(null)

  // Load remember me preference from localStorage on mount
  // Note: This is for UX only - Supabase sessions persist until logout by default via secure cookies
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('rememberMe')
      // Default to true if not set, otherwise use stored value
      setRememberMe(stored === null ? true : stored === 'true')
    }
  }, [])

  // Handle remember me checkbox change
  const handleRememberMeChange = (checked: boolean) => {
    setRememberMe(checked)
    if (typeof window !== 'undefined') {
      localStorage.setItem('rememberMe', checked.toString())
    }
  }

  const {
    register,
    formState: { errors, isValid },
    setError,
    clearErrors,
    trigger,
  } = useForm<LoginInput>({
    resolver: zodResolver(createLoginSchema(t)),
    mode: 'onBlur',
  })

  // Handle server-side errors
  useEffect(() => {
    if (state?.errors) {
      Object.entries(state.errors).forEach(([field, messages]) => {
        const messageArray = messages as string[]
        setError(field as keyof LoginInput, {
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

  // Map server error messages to translated versions
  const translateServerMessage = (message?: string): string | undefined => {
    if (!message) return message
    if (message === 'Invalid email or password') return t('auth.login.error.invalid')
    if (message === 'Please verify your email first') return t('auth.login.error.unverified')
    return message
  }

  const handleResendVerification = async () => {
    if (!state?.email) return

    const result = await resendVerification(state.email)
    if (result.success) {
      alert(t('auth.login.resendSuccess'))
    } else if (result.error) {
      alert(result.error)
    }
  }

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
          placeholder="you@example.com"
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
            placeholder="Enter your password"
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
      </div>

      {/* Remember me checkbox */}
      <div className="flex items-center space-x-2">
        <Checkbox
          id="remember"
          name="remember"
          checked={rememberMe}
          onCheckedChange={handleRememberMeChange}
        />
        <label
          htmlFor="remember"
          className="text-sm text-muted-foreground cursor-pointer select-none"
        >
          {t('auth.login.rememberMe')}
        </label>
      </div>

      {/* Server error message */}
      {state?.message && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {translateServerMessage(state.message)}
        </div>
      )}

      {/* Resend verification button */}
      {state?.showResend && (
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={handleResendVerification}
        >
          {t('auth.login.resend')}
        </Button>
      )}

      {/* Submit button */}
      <SubmitButton isValid={isValid} />

      {/* OAuth buttons */}
      <OAuthButtons />
    </form>
  )
}
