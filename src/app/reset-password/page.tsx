import Link from 'next/link'
import { cookies } from 'next/headers'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ROUTES } from '@/lib/constants/routes'
import { getTranslation } from '@/lib/i18n/translations'
import {
  LanguageCode,
  DEFAULT_LANGUAGE,
  LANGUAGE_COOKIE_NAME,
} from '@/lib/i18n/languages'
import { ResetPasswordForm } from './reset-form'

async function getLanguageFromCookies(): Promise<LanguageCode> {
  const cookieStore = await cookies()
  const langCookie = cookieStore.get(LANGUAGE_COOKIE_NAME)

  if (
    langCookie?.value &&
    ['en', 'ko', 'fr', 'zh', 'vi'].includes(langCookie.value)
  ) {
    return langCookie.value as LanguageCode
  }

  return DEFAULT_LANGUAGE
}

interface ResetPasswordPageProps {
  searchParams: Promise<{
    error?: string
    error_code?: string
    error_description?: string
  }>
}

export default async function ResetPasswordPage({
  searchParams,
}: ResetPasswordPageProps) {
  const params = await searchParams
  const lang = await getLanguageFromCookies()
  const t = (key: string) => getTranslation(lang, key)

  // Check for error states from Supabase
  const hasError =
    params.error ||
    params.error_code === 'access_denied' ||
    params.error_code === 'otp_expired'

  // Determine error message
  let errorMessage = ''
  if (params.error_code === 'access_denied') {
    errorMessage = t('password.linkInvalid')
  } else if (params.error_code === 'otp_expired') {
    errorMessage = t('password.linkExpired')
  } else if (params.error_description) {
    errorMessage = params.error_description
  } else if (params.error) {
    errorMessage = params.error
  }

  // If there's an error, show error state
  if (hasError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl text-center">
              {t('password.resetTitle')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              className="rounded-md bg-destructive/10 p-4 text-sm text-destructive text-center"
              role="alert"
            >
              {errorMessage || t('password.linkInvalid')}
            </div>
            <p className="text-sm text-muted-foreground text-center">
              {t('password.requirements')}
            </p>
            <Button asChild className="w-full">
              <Link href={ROUTES.LOGIN}>{t('password.requestNewLink')}</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Normal state: show the reset form
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">{t('password.resetTitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          <ResetPasswordForm />
        </CardContent>
      </Card>
    </div>
  )
}
