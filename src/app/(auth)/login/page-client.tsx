'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { LoginForm } from '@/components/auth/login-form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ROUTES } from '@/lib/constants/routes'
import { useI18n } from '@/lib/i18n'

interface LoginPageClientProps {
  oauthError?: string
  message?: string
}

export function LoginPageClient({ oauthError, message }: LoginPageClientProps) {
  const { t } = useI18n()
  const searchParams = useSearchParams()

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
