import type { Metadata } from 'next';
import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { unstable_cache } from 'next/cache';
import { cookies } from 'next/headers';
import { CafeMapWrapperDynamic } from '@/components/map/cafe-map-dynamic';
import { CafeMapSkeleton } from '@/components/map/cafe-map-skeleton';
import { transformCafeSummary, extractPhotoData } from '@/lib/supabase/transforms';
import { getFavoriteIdsAction } from '@/lib/actions/favorites';
import { ensureUserVibes } from '@/lib/supabase/vibes';
import { getTranslation } from '@/lib/i18n/translations';
import { LanguageCode, DEFAULT_LANGUAGE, LANGUAGE_COOKIE_NAME } from '@/lib/i18n/languages';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import type { CafeSummary } from '@/types/cafe';
import type { UserVibe } from '@/types/vibes';

export const metadata: Metadata = {
  title: 'Cafe Map',
  description: 'Explore cafes in Seoul on an interactive map. Find the perfect cafe near you.',
};

const getCachedCafes = unstable_cache(
  async (): Promise<CafeSummary[]> => {
    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data, error } = await supabase
      .from('cafes')
      .select(`
        id, name, slug, address, district_id,
        latitude, longitude,
        overall_rating, total_ratings,
        rating_food, rating_drinks, rating_temperature, rating_seating,
        rating_ambiance, rating_service, rating_noise, rating_aesthetic, rating_value,
        price_range, cafe_type,
        has_wifi, has_power_outlets, is_pet_friendly, is_laptop_friendly, has_parking,
        operating_hours,
        photos(storage_path, upvote_count, status)
      `)
      .eq('status', 'active');

    if (error) {
      console.error('Error fetching cafes:', error);
      return [];
    }

    return (data || []).map((row) => {
      const { primary_image_url, photo_urls } = extractPhotoData(row.photos as any);
      return transformCafeSummary({
        ...row,
        primary_image_url,
        photo_urls,
      });
    });
  },
  ['map-cafes'],
  { revalidate: 300 }
);

// Non-async page — shell renders immediately, Suspense streams data
export default function MapPage() {
  return (
    <main
      className="relative overflow-hidden"
      style={{ height: 'calc(100vh - var(--safe-header-height))', minHeight: '500px' }}
    >
      <Suspense fallback={
        <div className="absolute inset-0 w-full h-full">
          <CafeMapSkeleton />
        </div>
      }>
        <MapContent />
      </Suspense>
    </main>
  );
}

// Async component — data fetching happens here, streamed via Suspense
async function MapContent() {
  const supabase = await createClient();
  const cookieStore = await cookies();

  // getSession() reads JWT from cookie — no network round-trip
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;

  const langCookie = cookieStore.get(LANGUAGE_COOKIE_NAME);
  const lang: LanguageCode = (langCookie?.value && ['en', 'ko', 'fr', 'zh', 'vi'].includes(langCookie.value))
    ? langCookie.value as LanguageCode
    : DEFAULT_LANGUAGE;

  // Fetch cafes, favorite IDs, and vibes in parallel
  const [cafes, favoriteIds, userVibes] = await Promise.all([
    getCachedCafes(),
    user ? getUserFavoriteIds(supabase, user.id) : Promise.resolve([]),
    user ? ensureUserVibes(supabase, user.id, lang).catch(() => [] as UserVibe[]) : Promise.resolve([] as UserVibe[]),
  ]);

  return (
    <>
      <div className="absolute inset-0 w-full h-full">
        <CafeMapWrapperDynamic
          cafes={cafes}
          favoriteIds={favoriteIds}
          isLoggedIn={!!user}
          userId={user?.id}
          userVibes={userVibes}
        />
      </div>

      {/* Add Cafe Button - Floating Action Button */}
      <div className="absolute bottom-6 right-6 z-50">
        <Button asChild size="lg" className="h-12 w-12 shadow-lg sm:h-12 sm:w-auto">
          <Link href="/submit">
            <Plus className="h-5 w-5 sm:mr-2" />
            <span className="hidden sm:inline">{getTranslation(lang, 'cafes.addCafe')}</span>
          </Link>
        </Button>
      </div>
    </>
  );
}
