'use client'

import { useState } from 'react'
import { useFormState, useFormStatus } from 'react-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff } from 'lucide-react'
import { login, resendVerification } from '@/app/actions/auth'
import { createLoginSchema, type LoginInput } from '@/lib/validations/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
  const [state, formAction] = useFormState(login, null)

  const {
    register,
    formState: { errors, isValid },
    setError,
  } = useForm<LoginInput>({
    resolver: zodResolver(createLoginSchema(t)),
    mode: 'onBlur',
  })

  // Handle server-side errors
  if (state?.errors) {
    Object.entries(state.errors).forEach(([field, messages]) => {
      setError(field as keyof LoginInput, {
        type: 'server',
        message: messages[0],
      })
    })
  }

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
          {...register('email')}
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
            {...register('password')}
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
