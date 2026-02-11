'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
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
import { FormLoadingOverlay } from '@/components/auth/form-loading-overlay'
import { showAuthError } from './auth-toast'
import { useAutofillDetection } from '@/hooks/use-autofill-detection'

interface SubmitButtonProps {
  isValid: boolean
  isLoading: boolean
}

function SubmitButton({ isValid, isLoading }: SubmitButtonProps) {
  const { t } = useI18n()

  return (
    <Button
      type="submit"
      className="w-full transition-all duration-150"
      disabled={isLoading || !isValid}
    >
      {isLoading ? t('auth.signup.loading') : t('auth.signup.submit')}
    </Button>
  )
}

interface SignupFormProps {
  oauthError?: string
}

export function SignupForm({ oauthError }: SignupFormProps) {
  const { t } = useI18n()
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [touchedFields, setTouchedFields] = useState({ username: false, email: false, password: false })
  
  // Loading state management
  const [isLoading, setIsLoading] = useState(false)
  const [showOverlay, setShowOverlay] = useState(false)
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const {
    register,
    formState: { errors, isValid },
    setError: setFormError,
    clearErrors,
    trigger,
    watch,
    handleSubmit,
    setFocus,
    setValue,
    getValues,
  } = useForm<SignupInput>({
    resolver: zodResolver(createSignupSchema(t)),
    mode: 'onBlur',
    defaultValues: {
      username: '',
      email: '',
      password: '',
    },
  })

  // Watch password for strength meter
  const password = watch('password', '')

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

  // Escape key handler for loading cancellation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showOverlay && abortControllerRef.current) {
        abortControllerRef.current.abort()
        abortControllerRef.current = null
        stopLoading()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showOverlay, stopLoading])

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

  // Handle autofill detection using custom hook
  useAutofillDetection({
    fields: [
      { id: 'username', name: 'username' },
      { id: 'email', name: 'email' },
      { id: 'password', name: 'password' },
    ],
    onAutofill: (fieldName, value) => {
      setValue(fieldName as keyof SignupInput, value, { 
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true,
      })
    },
    enabled: true,
  })

  // Form submission handler
  const onSubmit = useCallback(async (data: SignupInput) => {
    clearErrors()
    
    // Create new abort controller for this request
    abortControllerRef.current = new AbortController()
    
    startLoading()
    
    try {
      const formData = new FormData()
      formData.append('username', data.username)
      formData.append('email', data.email)
      formData.append('password', data.password)
      
      const result = await signup(null, formData)

      // Successful signup - navigate to verify email page
      if (result?.redirectTo) {
        router.push(result.redirectTo)
        return
      }

      if (result?.errors) {
        Object.entries(result.errors).forEach(([field, messages]) => {
          const messageArray = messages as string[]
          setFormError(field as keyof SignupInput, {
            type: 'server',
            message: messageArray[0],
          })
        })
        
        // Focus the first invalid field
        setTimeout(() => {
          if (result.errors?.username) {
            setFocus('username')
          } else if (result.errors?.email) {
            setFocus('email')
          } else if (result.errors?.password) {
            setFocus('password')
          }
        }, 0)
      }
      
      if (result?.message) {
        if (result.message === 'account_already_exists') {
          showAuthError(t('auth.error.accountAlreadyExists'), t)
        } else {
          showAuthError(result.message, t)
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        // Request was cancelled - no error to show
        return
      }
      showAuthError(t('common.error'), t)
    } finally {
      stopLoading()
      abortControllerRef.current = null
    }
  }, [clearErrors, setFormError, startLoading, stopLoading, t])

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="relative space-y-4" aria-busy={isLoading}>
      {/* Loading overlay */}
      <FormLoadingOverlay
        isLoading={showOverlay}
        message={t('auth.signup.loading')}
        onCancel={handleCancel}
        cancelLabel={t('auth.loading.cancel')}
      />

      {/* OAuth error from URL */}
      {oauthError && (
        <div
          className="rounded-md bg-destructive/10 p-3 text-sm text-destructive animate-in fade-in slide-in-from-top-2 duration-200"
          role="alert"
          aria-live="assertive"
        >
          {oauthError}
        </div>
      )}

      {/* Username field */}
      <div className="space-y-2">
        <label htmlFor="username" className="text-sm font-medium">
          {t('auth.form.username')}
        </label>
        <Input
          id="username"
          type="text"
          placeholder={t('auth.form.usernamePlaceholder')}
          disabled={isLoading}
          {...register('username', {
            onChange: () => {
              // Clear error immediately when user types, if field was touched
              if (touchedFields.username && errors.username) {
                clearErrors('username')
              }
            },
            onBlur: async () => {
              setTouchedFields(prev => ({ ...prev, username: true }))
              await trigger('username')
            },
          })}
          aria-invalid={errors.username ? 'true' : 'false'}
          aria-describedby={errors.username ? 'username-error' : undefined}
          className="transition-all duration-150"
        />
        {errors.username && (
          <p id="username-error" className="text-sm text-destructive animate-in fade-in slide-in-from-top-2 duration-200">
            {errors.username.message}
          </p>
        )}
      </div>

      {/* Email field */}
      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium">
          {t('auth.form.email')}
        </label>
        <Input
          id="email"
          type="email"
          placeholder={t('auth.form.emailPlaceholder')}
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
          aria-invalid={errors.email ? 'true' : 'false'}
          aria-describedby={errors.email ? 'email-error' : undefined}
          className="transition-all duration-150"
        />
        {errors.email && (
          <p id="email-error" className="text-sm text-destructive animate-in fade-in slide-in-from-top-2 duration-200">
            {errors.email.message}
          </p>
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
            aria-describedby={errors.password ? 'password-error' : undefined}
            className="transition-all duration-150"
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
          <p id="password-error" className="text-sm text-destructive animate-in fade-in slide-in-from-top-2 duration-200">
            {errors.password.message}
          </p>
        )}
        {/* Password strength meter - only show after 3+ characters */}
        {password.length >= 3 && (
          <div className="animate-in slide-in-from-top-2 fade-in duration-200">
            <PasswordStrengthMeter password={password} t={t} />
          </div>
        )}
      </div>

      {/* Submit button */}
      <SubmitButton isValid={isValid} isLoading={isLoading} />

      {/* OAuth buttons */}
      <OAuthButtons />
    </form>
  )
}
