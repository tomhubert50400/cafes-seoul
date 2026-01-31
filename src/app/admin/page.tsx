import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { Coffee, Image } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getTranslation } from '@/lib/i18n/translations'
import { LanguageCode, DEFAULT_LANGUAGE, LANGUAGE_COOKIE_NAME } from '@/lib/i18n/languages'

async function getLanguageFromCookies(): Promise<LanguageCode> {
  const cookieStore = await cookies()
  const langCookie = cookieStore.get(LANGUAGE_COOKIE_NAME)

  if (langCookie?.value && ['en', 'ko', 'fr', 'zh', 'vi'].includes(langCookie.value)) {
    return langCookie.value as LanguageCode
  }

  return DEFAULT_LANGUAGE
}

export default async function AdminDashboard() {
  const supabase = await createClient()
  const lang = await getLanguageFromCookies()

  // Get pending submissions count
  const { count: pendingSubmissions } = await supabase
    .from('cafe_submissions')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending')

  // Get pending photos count
  const { count: pendingPhotos } = await supabase
    .from('photos')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending')

  const stats = [
    {
      title: getTranslation(lang, 'admin.pendingSubmissions'),
      count: pendingSubmissions ?? 0,
      icon: Coffee,
      href: '/admin/submissions',
    },
    {
      title: getTranslation(lang, 'admin.pendingPhotos'),
      count: pendingPhotos ?? 0,
      icon: Image,
      href: '/admin/photos',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">
          {getTranslation(lang, 'admin.title')}
        </h1>
        <p className="mt-1 text-muted-foreground">
          {getTranslation(lang, 'admin.dashboard.subtitle')}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Link key={stat.href} href={stat.href}>
              <Card className="transition-colors hover:bg-accent/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {stat.title}
                  </CardTitle>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.count}</div>
                  {stat.count === 0 ? (
                    <p className="text-xs text-muted-foreground">
                      {getTranslation(lang, 'admin.noPending')}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      {getTranslation(lang, 'admin.viewAll')}
                    </p>
                  )}
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
