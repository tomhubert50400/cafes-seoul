import { cookies } from 'next/headers';
import { Metadata } from 'next';
import { getTranslation } from '@/lib/i18n/translations';
import { LanguageCode, DEFAULT_LANGUAGE, LANGUAGE_COOKIE_NAME } from '@/lib/i18n/languages';
import { createClient } from '@/lib/supabase/server';
import { getFavoritesAction } from '@/lib/actions/favorites';
import { FavoritesList } from '@/components/favorites/favorites-list';
import { FavoritesEmpty } from '@/components/favorites/favorites-empty';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

async function getLanguageFromCookies(): Promise<LanguageCode> {
  const cookieStore = await cookies();
  const langCookie = cookieStore.get(LANGUAGE_COOKIE_NAME);

  if (langCookie?.value && ['en', 'ko', 'fr', 'zh', 'vi'].includes(langCookie.value)) {
    return langCookie.value as LanguageCode;
  }

  return DEFAULT_LANGUAGE;
}

export const metadata: Metadata = {
  title: 'Favorites | Cafes Seoul',
  description: 'View your favorite cafes',
};

export default async function FavoritesPage() {
  const lang = await getLanguageFromCookies();

  // Get current user
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Get favorites using action
  const result = await getFavoritesAction();

  if (!result.success) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{getTranslation(lang, 'favorites.title')}</CardTitle>
          <CardDescription>Failed to load favorites. Please try again.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const favorites = result.favorites ?? [];

  return (
    <>
      <Card className="border-none shadow-none bg-transparent">
        <CardHeader className="px-0">
          <CardTitle className="text-3xl font-bold">
            {getTranslation(lang, 'favorites.title')} ({favorites.length})
          </CardTitle>
          <CardDescription className="text-lg">
            {getTranslation(lang, 'favorites.emptyDescription')}
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="mt-4">
        {favorites.length === 0 ? (
          <FavoritesEmpty />
        ) : (
          <FavoritesList favorites={favorites} userId={user!.id} />
        )}
      </div>
    </>
  );
}
