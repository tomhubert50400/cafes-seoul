'use client'

import Link from 'next/link'
import { SignupForm } from '@/components/auth/signup-form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ROUTES } from '@/lib/constants/routes'
import { useI18n } from '@/lib/i18n'

interface SignupPageClientProps {
  oauthError?: string
}

export function SignupPageClient({ oauthError }: SignupPageClientProps) {
  const { t } = useI18n()

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-2xl">{t('auth.signup.title')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <SignupForm oauthError={oauthError} />
        <p className="text-sm text-center text-muted-foreground">
          {t('auth.signup.hasAccount')}{' '}
          <Link href={ROUTES.LOGIN} className="text-primary hover:underline">
            {t('auth.signup.loginLink')}
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
