import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'View your submissions, ratings, and photos on Seoul Cafe Guide.',
};
import { getTranslation } from '@/lib/i18n/translations';
import { LanguageCode, DEFAULT_LANGUAGE, LANGUAGE_COOKIE_NAME } from '@/lib/i18n/languages';
import { UserStats } from '@/components/dashboard/user-stats';
import { SubmissionsList } from '@/components/dashboard/submissions-list';
import { RatingsList } from '@/components/dashboard/ratings-list';
import { PhotosList } from '@/components/dashboard/photos-list';
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

  // Get Supabase URL for storage
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';

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
      .select('id, storage_path, status, upvote_count, created_at, rejection_reason, cafe:cafes(name)')
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

  // Build translations helper
  const t = (key: string) => getTranslation(lang, key);

  // Build translations objects for list components
  const submissionsTranslations = {
    empty: t('dashboard.cafes.empty'),
    emptyCta: t('dashboard.cafes.emptyCta'),
    loadMore: t('dashboard.loadMore'),
    remaining: t('dashboard.remaining'),
    showReason: t('dashboard.showReason'),
    hideReason: t('dashboard.hideReason'),
    rejectionReason: t('dashboard.rejectionReason'),
    edit: t('dashboard.actions.edit'),
    delete: t('dashboard.actions.delete'),
    deleteConfirm: t('dashboard.actions.deleteConfirm'),
    statusPending: t('dashboard.status.pending'),
    statusApproved: t('dashboard.status.approved'),
    statusDeclined: t('dashboard.status.declined'),
  };

  const ratingsTranslations = {
    empty: t('dashboard.ratings.empty'),
    emptyCta: t('dashboard.ratings.emptyCta'),
    loadMore: t('dashboard.loadMore'),
    remaining: t('dashboard.remaining'),
  };

  const photosTranslations = {
    empty: t('dashboard.photos.empty'),
    emptyCta: t('dashboard.photos.emptyCta'),
    loadMore: t('dashboard.loadMore'),
    remaining: t('dashboard.remaining'),
    upvotes: t('dashboard.upvotes'),
    delete: t('dashboard.actions.delete'),
    deleteConfirm: t('dashboard.actions.deleteConfirm'),
    rejectionReason: t('dashboard.rejectionReason'),
    statusPending: t('dashboard.status.pending'),
    statusApproved: t('dashboard.status.approved'),
    statusRejected: t('dashboard.status.rejected'),
  };

  // Transform submissions for component (ensure correct typing)
  const typedSubmissions = (submissions || []).map((s) => ({
    id: s.id as string,
    name: s.name as { en?: string; ko?: string },
    address: s.address as { en?: string; ko?: string },
    status: s.status as 'pending' | 'approved' | 'declined',
    created_at: s.created_at as string,
    rejection_reason: s.rejection_reason as string | null | undefined,
  }));

  // Transform ratings for component
  const typedRatings = (ratings || []).map((r) => {
    const cafeData = r.cafe as unknown;
    const cafe = Array.isArray(cafeData) ? cafeData[0] : cafeData;
    const typedCafe = cafe as { id: string; name: { en?: string; ko?: string }; slug: string } | null;

    return {
      id: r.id as string,
      overall: r.overall as number,
      created_at: r.created_at as string,
      cafe: typedCafe,
    };
  });

  // Transform photos for component
  const typedPhotos = (photos || []).map((p) => {
    const cafeData = p.cafe as unknown;
    const cafe = Array.isArray(cafeData) ? cafeData[0] : cafeData;
    const typedCafe = cafe as { name: { en?: string; ko?: string } } | null;

    return {
      id: p.id as string,
      storage_path: p.storage_path as string,
      status: p.status as 'pending' | 'approved' | 'rejected',
      upvote_count: p.upvote_count as number,
      created_at: p.created_at as string,
      rejection_reason: p.rejection_reason as string | null | undefined,
      cafe: typedCafe,
    };
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">{t('dashboard.title')}</h1>
      </div>

      {isNewUser ? (
        // Welcome empty state for new users
        <div className="rounded-lg border border-dashed py-12 text-center">
          <h2 className="text-2xl font-bold">{t('dashboard.welcome.title')}</h2>
          <p className="mt-2 text-muted-foreground">
            {t('dashboard.welcome.subtitle')}
          </p>
          <div className="mt-6 flex flex-col sm:flex-row justify-center gap-4">
            <Button asChild className="w-full sm:w-auto min-h-[44px]">
              <Link href={ROUTES.CAFES}>{t('dashboard.welcome.browse')}</Link>
            </Button>
            <Button variant="outline" asChild className="w-full sm:w-auto min-h-[44px]">
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
            <SubmissionsList
              submissions={typedSubmissions}
              totalCount={totalSubmissions ?? 0}
              userId={userId}
              translations={submissionsTranslations}
            />
          </section>

          {/* Ratings Section */}
          <section>
            <UserStats
              icon={Star}
              title={t('dashboard.ratings.title')}
              count={totalRatings ?? 0}
              metric={avgRating ? `${t('dashboard.ratings.avg')} ${avgRating}` : undefined}
            />
            <RatingsList
              ratings={typedRatings}
              totalCount={totalRatings ?? 0}
              userId={userId}
              translations={ratingsTranslations}
            />
          </section>

          {/* Photos Section */}
          <section>
            <UserStats
              icon={Image}
              title={t('dashboard.photos.title')}
              count={totalPhotos ?? 0}
            />
            <PhotosList
              photos={typedPhotos}
              totalCount={totalPhotos ?? 0}
              userId={userId}
              translations={photosTranslations}
              storageUrl={supabaseUrl}
            />
          </section>
        </div>
      )}
    </div>
  );
}
