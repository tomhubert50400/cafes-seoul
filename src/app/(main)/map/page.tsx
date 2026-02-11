import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { unstable_cache } from 'next/cache';
import { cookies } from 'next/headers';

export const metadata: Metadata = {
  title: 'Cafe Map',
  description: 'Explore cafes in Seoul on an interactive map. Find the perfect cafe near you.',
};
import { CafeMapWrapperDynamic } from '@/components/map/cafe-map-dynamic';
import { transformCafeSummary } from '@/lib/supabase/transforms';
import { getFavoriteIdsAction } from '@/lib/actions/favorites';
import { getTranslation } from '@/lib/i18n/translations';
import { LanguageCode, DEFAULT_LANGUAGE, LANGUAGE_COOKIE_NAME } from '@/lib/i18n/languages';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import type { CafeSummary } from '@/types/cafe';

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
        rating_ambiance, rating_wifi, rating_noise, rating_outlets, rating_value,
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
      const photos = row.photos as { storage_path: string; upvote_count: number; status: string }[] | null;
      const topPhoto = photos
        ?.filter((p) => p.status === 'approved')
        .sort((a, b) => b.upvote_count - a.upvote_count)[0];
      return transformCafeSummary({
        ...row,
        primary_image_url: topPhoto?.storage_path || null,
      });
    });
  },
  ['map-cafes'],
  { revalidate: 300 }
);

export default async function MapPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const cookieStore = await cookies();
  const langCookie = cookieStore.get(LANGUAGE_COOKIE_NAME);
  const lang: LanguageCode = (langCookie?.value && ['en', 'ko', 'fr', 'zh', 'vi'].includes(langCookie.value))
    ? langCookie.value as LanguageCode
    : DEFAULT_LANGUAGE;

  // Fetch cafes and favorite IDs in parallel
  const [cafes, favoriteResult] = await Promise.all([
    getCafes(),
    user ? getFavoriteIdsAction() : Promise.resolve({ success: false, cafeIds: [] }),
  ]);

  const favoriteIds = favoriteResult.success ? favoriteResult.cafeIds ?? [] : [];

  return (
    <main
      className="relative overflow-hidden"
      style={{ height: 'calc(100vh - 3.5rem)', minHeight: '500px' }}
    >
        <div className="absolute inset-0 w-full h-full">
          <CafeMapWrapperDynamic
            cafes={cafes}
            favoriteIds={favoriteIds}
            isLoggedIn={!!user}
            userId={user?.id}
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
    </main>
  );
}
