'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PasswordStrengthMeter } from '@/components/ui/password-strength-meter'
import { updatePassword } from '@/lib/actions/password'
import { useI18n } from '@/lib/i18n'
import { ROUTES } from '@/lib/constants/routes'

// Form schema with password match validation
const resetPasswordSchema = z
  .object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

type ResetPasswordInput = z.infer<typeof resetPasswordSchema>

export function ResetPasswordForm() {
  const { t } = useI18n()
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    mode: 'onChange',
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  })

  const password = watch('password', '')

  const onSubmit = async (data: ResetPasswordInput) => {
    setIsSubmitting(true)

    try {
      const result = await updatePassword(data.password)

      if (result.success) {
        // Redirect to login with success message
        router.push(`${ROUTES.LOGIN}?message=password_updated`)
      } else {
        // Show error from server
        const errorMessage =
          result.error?.password?.[0] || t('password.resetError')
        toast.error(errorMessage)
      }
    } catch {
      toast.error(t('password.resetError'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Password field */}
      <div className="space-y-2">
        <label htmlFor="password" className="text-sm font-medium">
          {t('password.newPassword')}
        </label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder={t('auth.form.passwordCreatePlaceholder')}
            disabled={isSubmitting}
            {...register('password')}
            aria-invalid={errors.password ? 'true' : 'false'}
            aria-describedby={errors.password ? 'password-error' : undefined}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            disabled={isSubmitting}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground disabled:opacity-50"
            aria-label={
              showPassword ? t('auth.form.hidePassword') : t('auth.form.showPassword')
            }
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
        {errors.password && (
          <p
            id="password-error"
            className="text-sm text-destructive animate-in fade-in slide-in-from-top-2 duration-200"
          >
            {errors.password.message}
          </p>
        )}
        {/* Password strength meter */}
        {password.length >= 3 && (
          <div className="animate-in slide-in-from-top-2 fade-in duration-200">
            <PasswordStrengthMeter password={password} />
          </div>
        )}
      </div>

      {/* Confirm password field */}
      <div className="space-y-2">
        <label htmlFor="confirmPassword" className="text-sm font-medium">
          {t('password.confirmPassword')}
        </label>
        <div className="relative">
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder={t('auth.form.passwordCreatePlaceholder')}
            disabled={isSubmitting}
            {...register('confirmPassword')}
            aria-invalid={errors.confirmPassword ? 'true' : 'false'}
            aria-describedby={
              errors.confirmPassword ? 'confirm-password-error' : undefined
            }
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            disabled={isSubmitting}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground disabled:opacity-50"
            aria-label={
              showConfirmPassword
                ? t('auth.form.hidePassword')
                : t('auth.form.showPassword')
            }
          >
            {showConfirmPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
        {errors.confirmPassword && (
          <p
            id="confirm-password-error"
            className="text-sm text-destructive animate-in fade-in slide-in-from-top-2 duration-200"
          >
            {errors.confirmPassword.message === 'Passwords do not match'
              ? t('password.passwordMismatch')
              : errors.confirmPassword.message}
          </p>
        )}
      </div>

      {/* Submit button */}
      <Button
        type="submit"
        className="w-full"
        disabled={isSubmitting || !isValid}
      >
        {isSubmitting ? t('password.updating') : t('password.updateButton')}
      </Button>
    </form>
  )
}
