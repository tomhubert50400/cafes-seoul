import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

export const metadata: Metadata = {
  title: 'My Profile',
  description: 'View and manage your Seoul Cafe Guide profile.',
};
import Link from 'next/link';
import { ROUTES } from '@/lib/constants/routes';
import { getTranslation } from '@/lib/i18n/translations';
import { LanguageCode, DEFAULT_LANGUAGE, LANGUAGE_COOKIE_NAME } from '@/lib/i18n/languages';
import { getProfile } from '@/lib/supabase/profiles';
import { ensureUserVibes } from '@/lib/supabase/vibes';
import { VibesCard } from '@/components/profile/vibes-card';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

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

  // Fetch profile, activity stats, and vibes in parallel
  const [profile, ratingsResult, favoritesResult, userVibes] = await Promise.all([
    getProfile(supabase, user.id),
    supabase
      .from('cafe_ratings')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id),
    supabase
      .from('user_favorites')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id),
    ensureUserVibes(supabase, user.id, lang),
  ]);

  const reviewsCount = ratingsResult.count ?? 0;
  const favoritesCount = favoritesResult.count ?? 0;

  // Get avatar URL - handle both storage paths and full URLs (OAuth)
  let avatarUrl: string | null = user.user_metadata?.avatar_url || null;
  if (profile?.avatar_url) {
    if (profile.avatar_url.startsWith('http://') || profile.avatar_url.startsWith('https://')) {
      avatarUrl = profile.avatar_url;
    } else {
      const { data } = supabase.storage.from('avatars').getPublicUrl(profile.avatar_url);
      avatarUrl = data.publicUrl;
    }
  }

  const displayName = profile?.display_name || user.user_metadata?.name || user.email;

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
                src={avatarUrl || undefined}
                alt={displayName || ''}
              />
              <AvatarFallback>{getInitials(displayName || user.email || '?')}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{displayName}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium">{getTranslation(lang, 'profile.memberSince')}:</span>{' '}
              {formatDate(user.created_at, lang)}
            </p>
          </div>

          <Button variant="outline" asChild className="w-full sm:w-auto min-h-[44px]">
            <Link href={ROUTES.PROFILE_SETTINGS}>
              {getTranslation(lang, 'profile.editProfile')}
            </Link>
          </Button>
        </CardContent>
      </Card>

      {/* Activity Card */}
      <Card>
        <CardHeader>
          <CardTitle>{getTranslation(lang, 'profile.activity')}</CardTitle>
          <CardDescription>
            {getTranslation(lang, 'profile.activityDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <Link
              href={ROUTES.PROFILE_REVIEWS}
              className="rounded-lg border p-4 text-center hover:bg-muted/50 transition-colors"
            >
              <p className="text-3xl font-bold">{reviewsCount}</p>
              <p className="text-sm text-muted-foreground">{getTranslation(lang, 'profile.reviews')}</p>
            </Link>
            <Link
              href={ROUTES.PROFILE_FAVORITES}
              className="rounded-lg border p-4 text-center hover:bg-muted/50 transition-colors"
            >
              <p className="text-3xl font-bold">{favoritesCount}</p>
              <p className="text-sm text-muted-foreground">{getTranslation(lang, 'profile.favorites')}</p>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* My Vibes Card */}
      <VibesCard initialVibes={userVibes} lang={lang} />
    </div>
  );
}
