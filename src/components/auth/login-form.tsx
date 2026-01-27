'use client'

import { useState } from 'react'
import { useFormState, useFormStatus } from 'react-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff } from 'lucide-react'
import { login, resendVerification } from '@/app/actions/auth'
import { loginSchema, type LoginInput } from '@/lib/validations/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

function SubmitButton({ isValid }: { isValid: boolean }) {
  const { pending } = useFormStatus()

  return (
    <Button type="submit" className="w-full" disabled={pending || !isValid}>
      {pending ? 'Logging in...' : 'Log in'}
    </Button>
  )
}

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [state, formAction] = useFormState(login, null)

  const {
    register,
    formState: { errors, isValid },
    setError,
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
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

  const handleResendVerification = async () => {
    if (!state?.email) return

    const result = await resendVerification(state.email)
    if (result.success) {
      alert('Verification email sent! Check your inbox.')
    } else if (result.error) {
      alert(result.error)
    }
  }

  return (
    <form action={formAction} className="space-y-4">
      {/* Email field */}
      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium">
          Email
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
          Password
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
            aria-label={showPassword ? 'Hide password' : 'Show password'}
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
          {state.message}
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
          Resend verification email
        </Button>
      )}

      {/* Submit button */}
      <SubmitButton isValid={isValid} />
    </form>
  )
}
