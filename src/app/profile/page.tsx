import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { ROUTES } from '@/lib/constants/routes';
import { getTranslation } from '@/lib/i18n/translations';
import { LanguageCode, DEFAULT_LANGUAGE, LANGUAGE_COOKIE_NAME } from '@/lib/i18n/languages';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { User } from '@supabase/supabase-js';

async function getLanguageFromCookies(): Promise<LanguageCode> {
  const cookieStore = await cookies();
  const langCookie = cookieStore.get(LANGUAGE_COOKIE_NAME);
  
  if (langCookie?.value && ['en', 'ko', 'fr', 'zh', 'vi'].includes(langCookie.value)) {
    return langCookie.value as LanguageCode;
  }
  
  return DEFAULT_LANGUAGE;
}

function getInitials(email: string): string {
  return email.substring(0, 2).toUpperCase();
}

function formatDate(dateString: string, lang: LanguageCode): string {
  const date = new Date(dateString);
  
  const formatters: Record<LanguageCode, Intl.DateTimeFormat> = {
    en: new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
    ko: new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' }),
    fr: new Intl.DateTimeFormat('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' }),
    zh: new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' }),
    vi: new Intl.DateTimeFormat('vi-VN', { year: 'numeric', month: 'long', day: 'numeric' }),
  };
  
  return formatters[lang].format(date);
}

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Protect the route
  if (!user) {
    redirect(ROUTES.LOGIN + '?next=/profile');
  }

  const lang = await getLanguageFromCookies();

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Account Information Card */}
      <Card>
        <CardHeader>
          <CardTitle>{getTranslation(lang, 'profile.accountInfo')}</CardTitle>
          <CardDescription>
            {user.email}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar size="lg">
              <AvatarImage
                src={user.user_metadata?.avatar_url}
                alt={user.user_metadata?.name || user.email || ''}
              />
              <AvatarFallback>{getInitials(user.email || '?')}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{user.user_metadata?.name || user.email}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium">{getTranslation(lang, 'profile.memberSince')}:</span>{' '}
              {formatDate(user.created_at, lang)}
            </p>
          </div>

          <Button variant="outline" disabled>
            {getTranslation(lang, 'profile.editProfile')}
          </Button>
        </CardContent>
      </Card>

      {/* Activity Card */}
      <Card>
        <CardHeader>
          <CardTitle>{getTranslation(lang, 'profile.activity')}</CardTitle>
          <CardDescription>
            Your activity stats
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg border p-4 text-center">
              <p className="text-3xl font-bold">0</p>
              <p className="text-sm text-muted-foreground">{getTranslation(lang, 'profile.reviews')}</p>
            </div>
            <div className="rounded-lg border p-4 text-center">
              <p className="text-3xl font-bold">0</p>
              <p className="text-sm text-muted-foreground">{getTranslation(lang, 'profile.favorites')}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
