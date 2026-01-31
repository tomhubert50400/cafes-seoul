import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { getTranslation } from '@/lib/i18n/translations';
import { LanguageCode, DEFAULT_LANGUAGE, LANGUAGE_COOKIE_NAME } from '@/lib/i18n/languages';
import { UserStats } from '@/components/dashboard/user-stats';
import { StatusBadge } from '@/components/dashboard/status-badge';
import { Coffee, Star, Image } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/lib/constants/routes';

async function getLanguageFromCookies(): Promise<LanguageCode> {
  const cookieStore = await cookies();
  const langCookie = cookieStore.get(LANGUAGE_COOKIE_NAME);

  if (langCookie?.value && ['en', 'ko', 'fr', 'zh', 'vi'].includes(langCookie.value)) {
    return langCookie.value as LanguageCode;
  }

  return DEFAULT_LANGUAGE;
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const lang = await getLanguageFromCookies();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // User is guaranteed to exist due to layout auth check
  const userId = user!.id;

  // Fetch all data in parallel (6 queries simultaneously)
  const [
    { count: totalSubmissions },
    { count: totalRatings },
    { count: totalPhotos },
    { data: submissions },
    { data: ratings },
    { data: photos },
  ] = await Promise.all([
    // Count queries (head: true = no data transfer, just count)
    supabase
      .from('cafe_submissions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId),
    supabase
      .from('cafe_ratings')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId),
    supabase
      .from('photos')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId),

    // Recent items (first 5 per section)
    supabase
      .from('cafe_submissions')
      .select('id, name, address, status, created_at, rejection_reason')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('cafe_ratings')
      .select('id, overall, created_at, cafe:cafes(id, name, slug)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('photos')
      .select('id, storage_path, status, upvote_count, created_at, cafe:cafes(name)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5),
  ]);

  // Calculate average rating (client-side is fine for <1000 ratings)
  const avgRating =
    ratings && ratings.length > 0
      ? (ratings.reduce((sum, r) => sum + r.overall, 0) / ratings.length).toFixed(1)
      : null;

  // Check if user is completely new (no contributions at all)
  const isNewUser =
    (totalSubmissions ?? 0) === 0 &&
    (totalRatings ?? 0) === 0 &&
    (totalPhotos ?? 0) === 0;

  // Build translations
  const t = (key: string) => getTranslation(lang, key);

  // Status translations
  const statusTranslations = {
    pending: t('dashboard.status.pending'),
    approved: t('dashboard.status.approved'),
    declined: t('dashboard.status.declined'),
    rejected: t('dashboard.status.rejected'),
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">{t('dashboard.title')}</h1>
      </div>

      {isNewUser ? (
        // Welcome empty state for new users
        <div className="rounded-lg border border-dashed py-12 text-center">
          <h2 className="text-2xl font-bold">{t('dashboard.welcome.title')}</h2>
          <p className="mt-2 text-muted-foreground">
            {t('dashboard.welcome.subtitle')}
          </p>
          <div className="mt-6 flex justify-center gap-4">
            <Button asChild>
              <Link href={ROUTES.CAFES}>{t('dashboard.welcome.browse')}</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={ROUTES.MAP}>{t('dashboard.welcome.submit')}</Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Cafe Submissions Section */}
          <section>
            <UserStats
              icon={Coffee}
              title={t('dashboard.cafes.title')}
              count={totalSubmissions ?? 0}
            />
            {submissions && submissions.length > 0 ? (
              <div className="mt-4 space-y-3">
                {submissions.map((submission) => {
                  const cafeName =
                    submission.name?.en || submission.name?.ko || 'Unnamed';
                  return (
                    <div
                      key={submission.id}
                      className="flex items-start justify-between rounded-lg border p-4"
                    >
                      <div className="flex-1">
                        <p className="font-medium">{cafeName}</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {submission.address?.en || submission.address?.ko}
                        </p>
                        <div className="mt-2">
                          <StatusBadge
                            status={submission.status}
                            label={statusTranslations[submission.status as keyof typeof statusTranslations]}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="mt-4 rounded-lg border border-dashed p-8 text-center">
                <p className="text-sm text-muted-foreground">
                  {t('dashboard.cafes.empty') || 'No cafe submissions yet'}
                </p>
              </div>
            )}
          </section>

          {/* Ratings Section */}
          <section>
            <UserStats
              icon={Star}
              title={t('dashboard.ratings.title')}
              count={totalRatings ?? 0}
              metric={avgRating ? `${t('dashboard.ratings.avg')} ${avgRating}` : undefined}
            />
            {ratings && ratings.length > 0 ? (
              <div className="mt-4 space-y-3">
                {ratings.map((rating) => {
                  const cafeData = rating.cafe as unknown;
                  const cafe = Array.isArray(cafeData) ? cafeData[0] : cafeData;
                  const typedCafe = cafe as { id: string; name: { en?: string; ko?: string }; slug: string } | null;
                  const cafeName = typedCafe?.name?.en || typedCafe?.name?.ko || 'Unknown Cafe';
                  const cafeSlug = typedCafe?.slug;

                  return (
                    <Link
                      key={rating.id}
                      href={cafeSlug ? ROUTES.CAFE_DETAIL(cafeSlug) : '#'}
                      className="block rounded-lg border p-4 transition-colors hover:bg-accent"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{cafeName}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(rating.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-lg font-bold">{rating.overall}</div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="mt-4 rounded-lg border border-dashed p-8 text-center">
                <p className="text-sm text-muted-foreground">
                  {t('dashboard.ratings.empty') || 'No ratings yet'}
                </p>
                <Button asChild className="mt-4" variant="outline">
                  <Link href={ROUTES.CAFES}>{t('dashboard.welcome.browse')}</Link>
                </Button>
              </div>
            )}
          </section>

          {/* Photos Section */}
          <section>
            <UserStats
              icon={Image}
              title={t('dashboard.photos.title')}
              count={totalPhotos ?? 0}
            />
            {photos && photos.length > 0 ? (
              <div className="mt-4 space-y-3">
                {photos.map((photo) => {
                  const cafeData = photo.cafe as unknown;
                  const cafe = Array.isArray(cafeData) ? cafeData[0] : cafeData;
                  const typedCafe = cafe as { name: { en?: string; ko?: string } } | null;
                  const cafeName = typedCafe?.name?.en || typedCafe?.name?.ko || 'Unknown Cafe';

                  return (
                    <div
                      key={photo.id}
                      className="flex items-center justify-between rounded-lg border p-4"
                    >
                      <div>
                        <p className="font-medium">{cafeName}</p>
                        <div className="mt-1 flex items-center gap-2">
                          <StatusBadge
                            status={photo.status}
                            label={statusTranslations[photo.status as keyof typeof statusTranslations]}
                          />
                          {photo.upvote_count > 0 && (
                            <span className="text-sm text-muted-foreground">
                              {photo.upvote_count} upvote{photo.upvote_count !== 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {new Date(photo.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="mt-4 rounded-lg border border-dashed p-8 text-center">
                <p className="text-sm text-muted-foreground">
                  {t('dashboard.photos.empty') || 'No photos uploaded yet'}
                </p>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
