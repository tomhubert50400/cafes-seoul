import { Suspense } from 'react';
import { Header } from '@/components/header';
import { SearchFilters } from '@/components/search-filters';
import { CafeList } from '@/components/cafe-list';
import { CafeCardSkeleton } from '@/components/cafe-card';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/server';
import { transformCafeSummary } from '@/lib/supabase/transforms';
import { getDistrictBySlug } from '@/lib/constants/districts';
import type { CafeSummary } from '@/types/cafe';
import type { CafeListParams } from '@/types/api';
import Link from 'next/link';

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

async function getCafes(params: CafeListParams): Promise<{
  cafes: CafeSummary[];
  total: number;
  page: number;
  totalPages: number;
}> {
  const supabase = await createClient();

  const page = params.page || 1;
  const limit = Math.min(params.limit || 12, 50);
  const offset = (page - 1) * limit;

  let query = supabase
    .from('cafes')
    .select(
      `
      id,
      name_ko,
      name_en,
      slug,
      address_ko,
      district_id,
      latitude,
      longitude,
      overall_rating,
      total_ratings,
      price_range,
      cafe_type,
      has_wifi,
      has_power_outlets,
      is_pet_friendly,
      is_laptop_friendly,
      cafe_images(storage_path)
    `,
      { count: 'exact' }
    )
    .eq('status', 'active');

  // Apply filters
  if (params.district) {
    const district = getDistrictBySlug(params.district);
    if (district) {
      query = query.eq('district_id', district.id);
    }
  }

  if (params.minRating) {
    query = query.gte('overall_rating', params.minRating);
  }

  if (params.priceRange) {
    const ranges = params.priceRange.split(',').map(Number);
    query = query.in('price_range', ranges);
  }

  if (params.cafeType) {
    query = query.eq('cafe_type', params.cafeType);
  }

  if (params.hasWifi) {
    query = query.eq('has_wifi', true);
  }

  if (params.hasOutlets) {
    query = query.eq('has_power_outlets', true);
  }

  if (params.isPetFriendly) {
    query = query.eq('is_pet_friendly', true);
  }

  if (params.isLaptopFriendly) {
    query = query.eq('is_laptop_friendly', true);
  }

  if (params.hasParking) {
    query = query.eq('has_parking', true);
  }

  if (params.hasOutdoorSeating) {
    query = query.eq('has_outdoor_seating', true);
  }

  if (params.q) {
    query = query.or(
      `name_ko.ilike.%${params.q}%,name_en.ilike.%${params.q}%,address_ko.ilike.%${params.q}%`
    );
  }

  // Apply sorting
  switch (params.sortBy) {
    case 'reviews':
      query = query.order('total_ratings', { ascending: params.sortOrder === 'asc' });
      break;
    case 'newest':
      query = query.order('created_at', { ascending: params.sortOrder === 'asc' });
      break;
    case 'rating':
    default:
      query = query.order('overall_rating', { ascending: params.sortOrder === 'asc' });
  }

  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error('Error fetching cafes:', error);
    return { cafes: [], total: 0, page, totalPages: 0 };
  }

  const cafes = (data || []).map((row) => {
    const images = row.cafe_images as { storage_path: string }[] | null;
    return transformCafeSummary({
      ...row,
      primary_image_url: images?.[0]?.storage_path || null,
    });
  });

  return {
    cafes,
    total: count || 0,
    page,
    totalPages: Math.ceil((count || 0) / limit),
  };
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

async function CafeListWithData({ searchParams }: { searchParams: CafeListParams }) {
  const { cafes, total, page, totalPages } = await getCafes(searchParams);

  return (
    <div className="space-y-8">
      {/* Results count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          총 <span className="font-medium text-foreground">{total}</span>개의 카페
        </p>
      </div>

      {/* Cafe grid */}
      <CafeList cafes={cafes} emptyMessage="조건에 맞는 카페가 없습니다" />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {page > 1 && (
            <Button variant="outline" asChild>
              <Link
                href={{
                  pathname: '/cafes',
                  query: { ...searchParams, page: page - 1 },
                }}
              >
                이전
              </Link>
            </Button>
          )}

          <span className="px-4 text-sm text-muted-foreground">
            {page} / {totalPages}
          </span>

          {page < totalPages && (
            <Button variant="outline" asChild>
              <Link
                href={{
                  pathname: '/cafes',
                  query: { ...searchParams, page: page + 1 },
                }}
              >
                다음
              </Link>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

export default async function CafesPage({ searchParams }: PageProps) {
  const params = await searchParams;

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
    sortBy: (params.sortBy as CafeListParams['sortBy']) || 'rating',
    sortOrder: (params.sortOrder as CafeListParams['sortOrder']) || 'desc',
    q: params.q as string | undefined,
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="mx-auto max-w-6xl px-4 py-8">
        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">카페 찾기</h1>
          <p className="mt-2 text-muted-foreground">
            서울의 다양한 카페를 필터와 검색으로 찾아보세요
          </p>
        </div>

        {/* Filters */}
        <Suspense fallback={null}>
          <SearchFilters className="mb-8" />
        </Suspense>

        {/* Cafe list */}
        <Suspense fallback={<CafeListSkeleton />}>
          <CafeListWithData searchParams={cafeListParams} />
        </Suspense>
      </main>
    </div>
  );
}
