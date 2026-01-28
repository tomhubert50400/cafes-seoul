'use client'

import Link from 'next/link'
import { LoginForm } from '@/components/auth/login-form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ROUTES } from '@/lib/constants/routes'
import { useI18n } from '@/lib/i18n'

interface LoginPageClientProps {
  oauthError?: string
}

export function LoginPageClient({ oauthError }: LoginPageClientProps) {
  const { t } = useI18n()

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-2xl">{t('auth.login.title')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
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
