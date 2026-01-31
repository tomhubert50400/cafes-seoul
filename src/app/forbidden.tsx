import Link from 'next/link'
import { cookies } from 'next/headers'
import { ShieldX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getTranslation } from '@/lib/i18n/translations'
import { LanguageCode, DEFAULT_LANGUAGE, LANGUAGE_COOKIE_NAME } from '@/lib/i18n/languages'
import { ROUTES } from '@/lib/constants/routes'

async function getLanguageFromCookies(): Promise<LanguageCode> {
  const cookieStore = await cookies()
  const langCookie = cookieStore.get(LANGUAGE_COOKIE_NAME)

  if (langCookie?.value && ['en', 'ko', 'fr', 'zh', 'vi'].includes(langCookie.value)) {
    return langCookie.value as LanguageCode
  }

  return DEFAULT_LANGUAGE
}

export default async function Forbidden() {
  const lang = await getLanguageFromCookies()

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="text-center">
        <div className="mb-6 flex justify-center">
          <ShieldX className="h-16 w-16 text-destructive" />
        </div>
        <h1 className="mb-2 text-4xl font-bold text-foreground">
          {getTranslation(lang, 'admin.forbidden.title')}
        </h1>
        <p className="mb-8 text-lg text-muted-foreground">
          {getTranslation(lang, 'admin.forbidden.message')}
        </p>
        <Button asChild>
          <Link href={ROUTES.HOME}>
            {getTranslation(lang, 'admin.forbidden.back')}
          </Link>
        </Button>
      </div>
    </div>
  )
}
