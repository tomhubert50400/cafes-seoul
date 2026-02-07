import { Suspense } from 'react';
import { headers } from 'next/headers';
import { Footer } from '@/components/footer';
import { Header } from '@/components/header';
import { SearchFilters } from '@/components/search-filters';
import { CafeList } from '@/components/cafe-list';
import { CafeCardSkeleton } from '@/components/cafe-card';
import { CafesPageHeader } from '@/components/cafes/page-header';
import { ResultsInfo } from '@/components/cafes/results-info';
import { Pagination } from '@/components/cafes/pagination';
import { fetchCafes } from '@/lib/api/cafes';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { RouletteCta } from '@/components/roulette/roulette-cta';
import type { CafeSummary } from '@/types/cafe';
import type { CafeListParams } from '@/types/api';
import { getFavoriteIdsAction } from '@/lib/actions/favorites';

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

async function CafeListWithData({
  searchParams,
  userId,
}: {
  searchParams: CafeListParams;
  userId?: string;
}) {
  // Fetch cafes and favorites in parallel
  const [cafesResult, favoritesResult] = await Promise.all([
    getCafes(searchParams),
    userId ? getFavoriteIdsAction() : Promise.resolve({ success: false, cafeIds: [] }),
  ]);

  const { cafes, total, page, totalPages } = cafesResult;
  const favoriteIds = favoritesResult.success ? favoritesResult.cafeIds : [];

  return (
    <div className="space-y-8">
      <ResultsInfo total={total} />
      <CafeList cafes={cafes} favoriteIds={favoriteIds} userId={userId} />
      <Pagination page={page} totalPages={totalPages} searchParams={searchParams as Record<string, string | number | boolean | undefined>} />
    </div>
  );
}

export default async function CafesPage({ searchParams }: PageProps) {
  const params = await searchParams;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const cafeListParams: CafeListParams = {
    page: params.page ? parseInt(params.page as string) : 1,
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
    wifiMin: params.wifiMin ? parseInt(params.wifiMin as string) : undefined,
    foodMin: params.foodMin ? parseInt(params.foodMin as string) : undefined,
    drinksMin: params.drinksMin ? parseInt(params.drinksMin as string) : undefined,
    lightingMin: params.lightingMin ? parseInt(params.lightingMin as string) : undefined,
    outletsMin: params.outletsMin ? parseInt(params.outletsMin as string) : undefined,
    quietnessMin: params.quietnessMin ? parseInt(params.quietnessMin as string) : undefined,
    priceValueMin: params.priceValueMin ? parseInt(params.priceValueMin as string) : undefined,
    comfortMin: params.comfortMin ? parseInt(params.comfortMin as string) : undefined,
    sortBy: (params.sortBy as CafeListParams['sortBy']) || 'rating',
    sortOrder: (params.sortOrder as CafeListParams['sortOrder']) || 'desc',
    q: params.q as string | undefined,
  };

  return (
    <div className="min-h-screen bg-background">
      <Header user={user} />
      <main className="mx-auto max-w-6xl px-4 py-8">
        {/* Header with Add Cafe button */}
        <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <CafesPageHeader />
          <Button asChild className="shrink-0">
            <Link href="/submit">
              <Plus className="h-4 w-4 mr-2" />
              Add Cafe
            </Link>
          </Button>
        </div>

        {/* Roulette CTA */}
        <div className="mb-6">
          <RouletteCta translationKey="cafes.rouletteCta" />
        </div>

        <Suspense fallback={null}>
          <SearchFilters className="mb-8" />
        </Suspense>

        <Suspense fallback={<CafeListSkeleton />}>
          <CafeListWithData searchParams={cafeListParams} userId={user?.id} />
        </Suspense>
      </main>

      <Footer />
    </div>
  );
}
