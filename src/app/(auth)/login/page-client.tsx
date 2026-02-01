'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { LoginForm } from '@/components/auth/login-form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { ROUTES } from '@/lib/constants/routes'
import { useI18n } from '@/lib/i18n'
import { requestPasswordReset } from '@/lib/actions/password'

interface LoginPageClientProps {
  oauthError?: string
  message?: string
}

export function LoginPageClient({ oauthError, message }: LoginPageClientProps) {
  const { t } = useI18n()
  const searchParams = useSearchParams()
  const [forgotEmail, setForgotEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)

  const handleForgotPassword = async () => {
    if (!forgotEmail.trim()) return

    setIsSubmitting(true)
    try {
      await requestPasswordReset(forgotEmail.trim())
      // Always show success to prevent email enumeration
      toast.success(t('auth.forgotPassword.linkSent'), { duration: 5000 })
      setDialogOpen(false)
      setForgotEmail('')
    } catch {
      // Still show success to prevent enumeration
      toast.success(t('auth.forgotPassword.linkSent'), { duration: 5000 })
      setDialogOpen(false)
      setForgotEmail('')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Store next URL for redirect after successful login
  // This survives page reloads and multiple login attempts (email -> error -> try again)
  useEffect(() => {
    const nextUrl = searchParams.get('next')
    if (nextUrl && typeof window !== 'undefined') {
      sessionStorage.setItem('authNextUrl', nextUrl)
    }
  }, [searchParams])

  // Translate message codes
  const translatedMessage = message
    ? message === 'already_verified'
      ? t('auth.verify.already')
      : message === 'verified_login'
        ? t('auth.verify.verified_login')
        : message
    : undefined

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-2xl">{t('auth.login.title')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Success/Info message */}
        {translatedMessage && (
          <div className="rounded-md bg-primary/10 p-3 text-sm text-primary animate-in fade-in slide-in-from-top-2 duration-200">
            {translatedMessage}
          </div>
        )}
        <LoginForm oauthError={oauthError} />

        {/* Forgot password link */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <button
              type="button"
              className="w-full text-sm text-center text-muted-foreground hover:text-primary transition-colors"
            >
              {t('auth.forgotPassword.link')}
            </button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{t('auth.forgotPassword.title')}</DialogTitle>
              <DialogDescription>
                {t('auth.forgotPassword.description')}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <Input
                type="email"
                placeholder={t('auth.form.emailPlaceholder')}
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleForgotPassword()
                  }
                }}
              />
              <Button
                className="w-full"
                onClick={handleForgotPassword}
                disabled={isSubmitting || !forgotEmail.trim()}
              >
                {isSubmitting
                  ? t('auth.forgotPassword.sending')
                  : t('auth.forgotPassword.sendLink')}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <p className="text-sm text-center text-muted-foreground">
          {t('auth.login.noAccount')}{' '}
          <Link href={ROUTES.SIGNUP} className="text-primary hover:underline">
            {t('auth.login.signupLink')}
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
