'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
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
  const [showPassword, setShowPassword] = useState(false)
  const [touchedFields, setTouchedFields] = useState({ email: false, password: false })
  
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

  // Handle autofill detection - check for values filled by password managers
  useEffect(() => {
    if (typeof window === 'undefined') return

    // Check for autofill every 100ms for the first 3 seconds after mount
    // Password managers like Dashlane fill values programmatically
    const checkAutofill = () => {
      const emailInput = document.getElementById('email') as HTMLInputElement
      const passwordInput = document.getElementById('password') as HTMLInputElement

      if (emailInput && passwordInput) {
        const emailValue = emailInput.value
        const passwordValue = passwordInput.value
        const currentValues = getValues()

        // If inputs have values but form doesn't, autofill happened
        if (emailValue && !currentValues.email) {
          setValue('email', emailValue, { shouldValidate: true })
        }
        if (passwordValue && !currentValues.password) {
          setValue('password', passwordValue, { shouldValidate: true })
        }
      }
    }

    // Initial check
    checkAutofill()

    // Set up interval for early autofill detection
    const intervalId = setInterval(checkAutofill, 100)

    // Stop checking after 3 seconds
    const timeoutId = setTimeout(() => {
      clearInterval(intervalId)
    }, 3000)

    // Also listen for animation events which some browsers trigger on autofill
    const emailInput = document.getElementById('email')
    const passwordInput = document.getElementById('password')

    const handleAnimationStart = (e: AnimationEvent) => {
      if (e.animationName === 'onAutoFillStart') {
        checkAutofill()
      }
    }

    emailInput?.addEventListener('animationstart', handleAnimationStart)
    passwordInput?.addEventListener('animationstart', handleAnimationStart)

    return () => {
      clearInterval(intervalId)
      clearTimeout(timeoutId)
      emailInput?.removeEventListener('animationstart', handleAnimationStart)
      passwordInput?.removeEventListener('animationstart', handleAnimationStart)
    }
  }, [getValues, setValue])

  // Form submission handler
  const onSubmit = useCallback(async (data: SignupInput) => {
    clearErrors()
    
    // Create new abort controller for this request
    abortControllerRef.current = new AbortController()
    
    startLoading()
    
    try {
      const formData = new FormData()
      formData.append('email', data.email)
      formData.append('password', data.password)
      
      const result = await signup(null, formData)
      
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
          if (result.errors?.email) {
            setFocus('email')
          } else if (result.errors?.password) {
            setFocus('password')
          }
        }, 0)
      }
      
      if (result?.message) {
        // Show error as toast instead of inline
        showAuthError(result.message, t)
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
