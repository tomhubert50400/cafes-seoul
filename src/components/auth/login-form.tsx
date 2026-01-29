'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
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
import { FormLoadingOverlay } from '@/components/auth/form-loading-overlay'

interface SubmitButtonProps {
  isValid: boolean
  isLoading: boolean
}

function SubmitButton({ isValid, isLoading }: SubmitButtonProps) {
  const { t } = useI18n()

  return (
    <Button type="submit" className="w-full" disabled={isLoading || !isValid}>
      {isLoading ? t('auth.login.loading') : t('auth.login.submit')}
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
  const [touchedFields, setTouchedFields] = useState({ email: false, password: false })
  const emailInputRef = useRef<HTMLInputElement>(null)
  
  // Loading state management
  const [isLoading, setIsLoading] = useState(false)
  const [showOverlay, setShowOverlay] = useState(false)
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const [error, setError] = useState<string | null>(null)

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
    setError: setFormError,
    clearErrors,
    trigger,
    handleSubmit,
  } = useForm<LoginInput>({
    resolver: zodResolver(createLoginSchema(t)),
    mode: 'onBlur',
  })

  // Start loading with 200ms delay for overlay
  const startLoading = useCallback(() => {
    setIsLoading(true)
    loadingTimeoutRef.current = setTimeout(() => {
      setShowOverlay(true)
    }, 200)
  }, [])

  // Stop loading and cleanup
  const stopLoading = useCallback(() => {
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current)
      loadingTimeoutRef.current = null
    }
    setIsLoading(false)
    setShowOverlay(false)
  }, [])

  // Handle cancel button click
  const handleCancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    stopLoading()
  }, [stopLoading])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current)
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  // Store email for resend verification
  const [lastEmail, setLastEmail] = useState<string>('')

  // Form submission handler
  const onSubmit = useCallback(async (data: LoginInput) => {
    setError(null)
    clearErrors()
    setLastEmail(data.email)
    
    // Create new abort controller for this request
    abortControllerRef.current = new AbortController()
    
    startLoading()
    
    try {
      const formData = new FormData()
      formData.append('email', data.email)
      formData.append('password', data.password)
      formData.append('remember', rememberMe.toString())
      
      const result = await login(null, formData)
      
      if (result?.errors) {
        Object.entries(result.errors).forEach(([field, messages]) => {
          const messageArray = messages as string[]
          setFormError(field as keyof LoginInput, {
            type: 'server',
            message: messageArray[0],
          })
        })
        
        // Focus the first invalid field
        setTimeout(() => {
          if (result.errors?.email && emailInputRef.current) {
            emailInputRef.current.focus()
          }
        }, 0)
      }
      
      if (result?.message) {
        setError(result.message)
      }
      
      // Store email from result if available (for resend verification)
      if (result?.email) {
        setLastEmail(result.email)
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        // Request was cancelled - no error to show
        return
      }
      setError(t('common.error'))
    } finally {
      stopLoading()
      abortControllerRef.current = null
    }
  }, [clearErrors, rememberMe, setFormError, startLoading, stopLoading, t])

  // Map server error messages to translated versions
  const translateServerMessage = (message?: string): string | undefined => {
    if (!message) return message
    if (message === 'Invalid email or password') return t('auth.login.error.invalid')
    if (message === 'Please verify your email first') return t('auth.login.error.unverified')
    return message
  }

  const handleResendVerification = async () => {
    if (!lastEmail) return

    const result = await resendVerification(lastEmail)
    if (result.success) {
      alert(t('auth.login.resendSuccess'))
    } else if (result.error) {
      alert(result.error)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="relative space-y-4">
      {/* Loading overlay */}
      <FormLoadingOverlay
        isLoading={showOverlay}
        message={t('auth.login.loading')}
        onCancel={handleCancel}
        cancelLabel={t('auth.loading.cancel')}
      />

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
          disabled={isLoading}
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
            disabled={isLoading}
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
            disabled={isLoading}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground disabled:opacity-50"
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
          disabled={isLoading}
        />
        <label
          htmlFor="remember"
          className="text-sm text-muted-foreground cursor-pointer select-none"
        >
          {t('auth.login.rememberMe')}
        </label>
      </div>

      {/* Server error message */}
      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {translateServerMessage(error)}
        </div>
      )}

      {/* Resend verification button */}
      {error === 'Please verify your email first' && (
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={handleResendVerification}
          disabled={isLoading}
        >
          {t('auth.login.resend')}
        </Button>
      )}

      {/* Submit button */}
      <SubmitButton isValid={isValid} isLoading={isLoading} />

      {/* OAuth buttons */}
      <OAuthButtons />
    </form>
  )
}
