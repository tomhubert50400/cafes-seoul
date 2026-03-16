import type { Metadata } from 'next';
import { Suspense } from 'react';
import { headers } from 'next/headers';
import { Footer } from '@/components/footer';
import { SearchFilters } from '@/components/search-filters';
import { CafeCardSkeleton } from '@/components/cafe-card';
import { CafesPageHeader } from '@/components/cafes/page-header';
import { InfiniteCafeList } from '@/components/cafes/infinite-cafe-list';
import { fetchCafes } from '@/lib/api/cafes';
import { createClient } from '@/lib/supabase/server';
import { RouletteCta } from '@/components/roulette/roulette-cta';
import type { CafeSummary } from '@/types/cafe';
import type { CafeListParams } from '@/types/api';
import { getFavoriteIdsAction } from '@/lib/actions/favorites';

export const metadata: Metadata = {
  title: 'Browse Cafes',
  description: 'Browse and filter the best cafes in Seoul by district, rating, amenities, and more.',
};

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

async function getCafes(params: CafeListParams): Promise<{
  cafes: CafeSummary[];
  total: number;
  page: number;
  totalPages: number;
}> {
  const headersList = await headers();
  const host = headersList.get('host') || 'localhost:3000';
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';

  try {
    const response = await fetchCafes(params, `${protocol}://${host}`);
    return {
      cafes: response.data,
      total: response.meta.total,
      page: response.meta.page,
      totalPages: response.meta.totalPages,
    };
  } catch (error) {
    console.error('Error fetching cafes:', error);
    return { cafes: [], total: 0, page: params.page || 1, totalPages: 0 };
  }
}

function CafeListSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <CafeCardSkeleton key={i} />
      ))}
    </div>
  );
}

function parseSearchParams(params: { [key: string]: string | string[] | undefined }): CafeListParams {
  return {
    page: 1,
    limit: 12,
    district: params.district as string | undefined,
    neighborhood: params.neighborhood as string | undefined,
    minRating: params.minRating ? parseFloat(params.minRating as string) : undefined,
    priceRange: params.priceRange as string | undefined,
    cafeType: params.cafeType as CafeListParams['cafeType'],
    hasWifi: params.hasWifi === 'true',
    hasOutlets: params.hasOutlets === 'true',
    isPetFriendly: params.isPetFriendly === 'true',
    isLaptopFriendly: params.isLaptopFriendly === 'true',
    hasParking: params.hasParking === 'true',
    hasOutdoorSeating: params.hasOutdoorSeating === 'true',
    seatingMin: params.seatingMin ? parseInt(params.seatingMin as string) : undefined,
    serviceMin: params.serviceMin ? parseInt(params.serviceMin as string) : undefined,
    foodMin: params.foodMin ? parseInt(params.foodMin as string) : undefined,
    drinksMin: params.drinksMin ? parseInt(params.drinksMin as string) : undefined,
    lightingMin: params.lightingMin ? parseInt(params.lightingMin as string) : undefined,
    aestheticMin: params.aestheticMin ? parseInt(params.aestheticMin as string) : undefined,
    quietnessMin: params.quietnessMin ? parseInt(params.quietnessMin as string) : undefined,
    priceValueMin: params.priceValueMin ? parseInt(params.priceValueMin as string) : undefined,
    comfortMin: params.comfortMin ? parseInt(params.comfortMin as string) : undefined,
    openNow: params.openNow === 'true' ? true : undefined,
    favoritesOnly: params.favoritesOnly === 'true' ? true : undefined,
    sortBy: (params.sortBy as CafeListParams['sortBy']) || 'rating',
    sortOrder: (params.sortOrder as CafeListParams['sortOrder']) || 'desc',
    q: params.q as string | undefined,
  };
}

// Async component — all data fetching happens here, streamed via Suspense
async function CafeListContent({
  searchParamsPromise,
}: {
  searchParamsPromise: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParamsPromise;
  const cafeListParams = parseSearchParams(params);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const userId = user?.id;

  // Fetch favorites first so we can pass IDs to the API when filter is active
  const favoritesResult = userId
    ? await getFavoriteIdsAction()
    : { success: false, cafeIds: [] as string[] };
  const favoriteIds = favoritesResult.success ? favoritesResult.cafeIds ?? [] : [];

  // When favorites filter is active, pass the IDs to the API for server-side filtering
  const effectiveParams = { ...cafeListParams };
  if (cafeListParams.favoritesOnly && favoriteIds.length > 0) {
    effectiveParams.cafeIds = favoriteIds.join(',');
  }

  const { cafes, total, page, totalPages } = await getCafes(effectiveParams);

  return (
    <InfiniteCafeList
      initialCafes={cafes}
      initialTotal={total}
      initialPage={page}
      totalPages={totalPages}
      filterParams={effectiveParams as Record<string, string | number | boolean | undefined>}
      favoriteIds={favoriteIds}
      userId={userId}
    />
  );
}

// Non-async page — shell renders immediately, Suspense streams data
export default function CafesPage({ searchParams }: PageProps) {
  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-6xl px-4 py-8">
        {/* Header with Add Cafe button */}
        <CafesPageHeader />

        {/* Roulette CTA */}
        <div className="mb-6">
          <RouletteCta translationKey="cafes.rouletteCta" />
        </div>

        <Suspense fallback={null}>
          <SearchFilters className="mb-8" />
        </Suspense>

        <Suspense fallback={<CafeListSkeleton />}>
          <CafeListContent searchParamsPromise={searchParams} />
        </Suspense>
      </main>

      <Footer />
    </div>
  );
}
