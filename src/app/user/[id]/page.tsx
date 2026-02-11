import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getProfileForViewer } from '@/lib/supabase/profiles';
import { AvatarDisplay } from '@/components/profile/avatar-display';
import { Header } from '@/components/header';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getTranslation } from '@/lib/i18n/translations';
import { LanguageCode, DEFAULT_LANGUAGE, LANGUAGE_COOKIE_NAME } from '@/lib/i18n/languages';
import { ROUTES } from '@/lib/constants/routes';
import { Calendar, Star, Lock, Settings } from 'lucide-react';

interface PublicProfilePageProps {
  params: Promise<{ id: string }>;
}

async function getLanguageFromCookies(): Promise<LanguageCode> {
  const cookieStore = await cookies();
  const langCookie = cookieStore.get(LANGUAGE_COOKIE_NAME);

  if (langCookie?.value && ['en', 'ko', 'fr', 'zh', 'vi'].includes(langCookie.value)) {
    return langCookie.value as LanguageCode;
  }

  return DEFAULT_LANGUAGE;
}

export default async function PublicProfilePage({ params }: PublicProfilePageProps) {
  const { id: userId } = await params;
  const supabase = await createClient();

  // Get current viewer (may be null if not logged in)
  const { data: { user: viewer } } = await supabase.auth.getUser();

  // Get profile data based on viewer
  const { profile, isOwner, isPrivate } = await getProfileForViewer(
    supabase,
    userId,
    viewer?.id || null
  );

  const lang = await getLanguageFromCookies();

  // Profile doesn't exist
  if (!profile && !isPrivate) {
    notFound();
  }

  // Get avatar URL if exists
  let avatarUrl: string | null = null;
  if (profile?.avatar_url) {
    if (profile.avatar_url.startsWith('http')) {
      avatarUrl = profile.avatar_url;
    } else {
      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(profile.avatar_url);
      avatarUrl = data.publicUrl;
    }
  }

  // Private profile (not owner viewing)
  if (isPrivate) {
    return (
      <div className="min-h-screen bg-background">
        <Header user={viewer} />
        <div className="mx-auto max-w-2xl px-4 py-16">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <Lock className="h-16 w-16 text-muted-foreground mb-4" />
              <h1 className="text-xl font-semibold mb-2">
                {getTranslation(lang, 'publicProfile.private')}
              </h1>
              <p className="text-muted-foreground">
                {getTranslation(lang, 'publicProfile.privateDescription')}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const memberSince = new Date(profile!.created_at).toLocaleDateString(
    lang === 'ko' ? 'ko-KR' : lang === 'zh' ? 'zh-CN' : lang === 'vi' ? 'vi-VN' : lang === 'fr' ? 'fr-FR' : 'en-US',
    { year: 'numeric', month: 'long' }
  );

  return (
    <div className="min-h-screen bg-background">
      <Header user={viewer} />
      <div className="mx-auto max-w-2xl px-4 py-8">
        <Card>
          <CardHeader className="flex flex-col items-center text-center">
            {/* Avatar */}
            <AvatarDisplay
              userId={profile!.id}
              displayName={profile!.display_name}
              avatarUrl={avatarUrl}
              size="xl"
              className="mb-4"
            />

            {/* Display Name */}
            <h1 className="text-2xl font-bold">
              {profile!.display_name || profile!.username}
            </h1>

            {/* Username */}
            {profile!.display_name && (
              <p className="text-muted-foreground">@{profile!.username}</p>
            )}

            {/* Owner actions */}
            {isOwner && (
              <Button variant="outline" size="sm" asChild className="mt-4">
                <Link href={ROUTES.PROFILE_SETTINGS}>
                  <Settings className="h-4 w-4 mr-2" />
                  {getTranslation(lang, 'publicProfile.editProfile')}
                </Link>
              </Button>
            )}
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Bio */}
            {profile!.bio && (
              <div>
                <p className="text-sm text-center whitespace-pre-wrap">
                  {profile!.bio}
                </p>
              </div>
            )}

            {/* Stats */}
            <div className="flex justify-center gap-8 py-4 border-t">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Star className="h-4 w-4" />
                <span className="text-sm">
                  {profile!.total_reviews} {getTranslation(lang, 'publicProfile.reviews')}
                </span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span className="text-sm">
                  {getTranslation(lang, 'publicProfile.memberSince')} {memberSince}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
