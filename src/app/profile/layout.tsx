import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { Header } from '@/components/header';
import { ROUTES } from '@/lib/constants/routes';
import { getTranslation } from '@/lib/i18n/translations';
import { LanguageCode, DEFAULT_LANGUAGE, LANGUAGE_COOKIE_NAME } from '@/lib/i18n/languages';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { reactivateAccountIfScheduled, syncProfileFromAuthMetadata } from '@/lib/actions/profile';

interface ProfileLayoutProps {
  children: React.ReactNode;
}

async function getLanguageFromCookies(): Promise<LanguageCode> {
  const cookieStore = await cookies();
  const langCookie = cookieStore.get(LANGUAGE_COOKIE_NAME);
  
  if (langCookie?.value && ['en', 'ko', 'fr', 'zh', 'vi'].includes(langCookie.value)) {
    return langCookie.value as LanguageCode;
  }
  
  return DEFAULT_LANGUAGE;
}

export default async function ProfileLayout({ children }: ProfileLayoutProps) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Protect the route - redirect unauthenticated users to login
  if (!user) {
    redirect(ROUTES.LOGIN + '?next=/profile');
  }

  // If user was scheduled for deletion and logged back in, reactivate
  await reactivateAccountIfScheduled();

  // Sync profile from OAuth metadata if missing (for OAuth users)
  await syncProfileFromAuthMetadata();

  const lang = await getLanguageFromCookies();

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Header user={user} />
      <div className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="mb-8 text-2xl md:text-3xl font-bold">
          {getTranslation(lang, 'profile.title')}
        </h1>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="mb-8 w-full justify-start overflow-x-auto flex-nowrap sm:flex-wrap gap-2" variant="line">
            <TabsTrigger value="overview" asChild className="min-h-[44px]">
              <Link href={ROUTES.PROFILE}>
                {getTranslation(lang, 'profile.overview')}
              </Link>
            </TabsTrigger>
            <TabsTrigger value="reviews" asChild className="min-h-[44px]">
              <Link href={ROUTES.PROFILE_REVIEWS}>
                {getTranslation(lang, 'profile.reviews')}
              </Link>
            </TabsTrigger>
            <TabsTrigger value="favorites" asChild className="min-h-[44px]">
              <Link href={ROUTES.PROFILE_FAVORITES}>
                {getTranslation(lang, 'profile.favorites')}
              </Link>
            </TabsTrigger>
            <TabsTrigger value="submissions" asChild className="min-h-[44px]">
              <Link href={ROUTES.PROFILE_SUBMISSIONS}>
                {getTranslation(lang, 'profile.submissions')}
              </Link>
            </TabsTrigger>
            <TabsTrigger value="settings" asChild className="min-h-[44px]">
              <Link href={ROUTES.PROFILE_SETTINGS}>
                {getTranslation(lang, 'profile.settings')}
              </Link>
            </TabsTrigger>
          </TabsList>

          <div className="mt-6">
            {children}
          </div>
        </Tabs>
      </div>
    </div>
  );
}
