import Link from 'next/link';
import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { CafeCard } from '@/components/cafe-card';
import { createClient } from '@/lib/supabase/server';
import { transformCafeSummary } from '@/lib/supabase/transforms';
import { SEOUL_DISTRICTS, POPULAR_NEIGHBORHOODS } from '@/lib/constants/districts';
import { ROUTES } from '@/lib/constants/routes';
import type { CafeSummary } from '@/types/cafe';

async function getFeaturedCafes(): Promise<CafeSummary[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('cafes')
    .select(`
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
    `)
    .eq('status', 'active')
    .order('overall_rating', { ascending: false })
    .limit(6);

  if (error || !data) {
    return [];
  }

  return data.map((row) => {
    const images = row.cafe_images as { storage_path: string }[] | null;
    return transformCafeSummary({
      ...row,
      primary_image_url: images?.[0]?.storage_path || null,
    });
  });
}

export default async function HomePage() {
  const featuredCafes = await getFeaturedCafes();

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-zinc-100 to-background dark:from-zinc-900 dark:to-background">
        <div className="mx-auto max-w-6xl px-4 py-20 text-center md:py-32">
          <h1 className="text-4xl font-bold tracking-tight text-foreground md:text-5xl lg:text-6xl">
            서울의 <span className="text-primary">베스트 카페</span>를
            <br />
            찾아보세요
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            와이파이, 콘센트, 분위기 등 상세한 정보로 당신에게 딱 맞는 카페를 발견하세요.
            <br />
            Find your perfect cafe in Seoul with detailed reviews and ratings.
          </p>

          {/* Search bar */}
          <form action={ROUTES.CAFES} method="GET" className="mx-auto mt-8 flex max-w-xl gap-2">
            <Input
              type="search"
              name="q"
              placeholder="카페 이름, 지역으로 검색..."
              className="h-12 text-base"
            />
            <Button type="submit" size="lg" className="h-12 px-8">
              검색
            </Button>
          </form>

          {/* Popular searches */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            <span className="text-sm text-muted-foreground">인기:</span>
            {POPULAR_NEIGHBORHOODS.slice(0, 6).map((neighborhood) => (
              <Link
                key={neighborhood.slug}
                href={`${ROUTES.CAFES}?neighborhood=${neighborhood.slug}`}
              >
                <Badge variant="secondary" className="cursor-pointer hover:bg-secondary/80">
                  {neighborhood.nameKo}
                </Badge>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Cafes */}
      {featuredCafes.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-16">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">인기 카페</h2>
              <p className="mt-1 text-muted-foreground">가장 높은 평점의 카페들</p>
            </div>
            <Button variant="outline" asChild>
              <Link href={ROUTES.CAFES}>전체 보기</Link>
            </Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featuredCafes.map((cafe) => (
              <CafeCard key={cafe.id} cafe={cafe} />
            ))}
          </div>
        </section>
      )}

      {/* Browse by District */}
      <section className="bg-zinc-50 dark:bg-zinc-900/50">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold">지역별 카페</h2>
            <p className="mt-1 text-muted-foreground">서울 25개 구별로 카페를 탐색하세요</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {SEOUL_DISTRICTS.map((district) => (
              <Link
                key={district.slug}
                href={`${ROUTES.CAFES}?district=${district.slug}`}
                className="group rounded-lg border bg-card p-4 text-center transition-colors hover:bg-accent"
              >
                <span className="font-medium group-hover:text-accent-foreground">
                  {district.nameKo}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="mb-12 text-center">
          <h2 className="text-2xl font-bold">더 똑똑하게 카페 찾기</h2>
          <p className="mt-1 text-muted-foreground">당신이 필요한 정보를 한눈에</p>
        </div>
        <div className="grid gap-8 md:grid-cols-3">
          <FeatureCard
            icon={<WifiIcon />}
            title="상세한 시설 정보"
            description="와이파이 속도, 콘센트 위치, 좌석 편안함까지 상세하게 확인하세요"
          />
          <FeatureCard
            icon={<StarIcon />}
            title="다차원 평점"
            description="음료, 분위기, 가성비 등 9가지 카테고리별 평점으로 정확한 비교"
          />
          <FeatureCard
            icon={<MapIcon />}
            title="위치 기반 검색"
            description="현재 위치 주변 또는 원하는 지역의 카페를 쉽게 찾아보세요"
          />
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary text-primary-foreground">
        <div className="mx-auto max-w-6xl px-4 py-16 text-center">
          <h2 className="text-2xl font-bold">좋아하는 카페를 공유해주세요</h2>
          <p className="mx-auto mt-2 max-w-xl text-primary-foreground/80">
            리뷰를 작성하고 다른 사람들이 좋은 카페를 발견할 수 있도록 도와주세요
          </p>
          <Button variant="secondary" size="lg" className="mt-6" asChild>
            <Link href={ROUTES.SIGNUP}>시작하기</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t">
        <div className="mx-auto max-w-6xl px-4 py-8">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center gap-2">
              <CoffeeIcon className="h-5 w-5" />
              <span className="font-semibold">서울 카페</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2025 Seoul Cafe Guide. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-6 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        {icon}
      </div>
      <h3 className="mt-4 font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function CoffeeIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M17 8h1a4 4 0 1 1 0 8h-1" />
      <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
      <line x1="6" x2="6" y1="2" y2="4" />
      <line x1="10" x2="10" y1="2" y2="4" />
      <line x1="14" x2="14" y1="2" y2="4" />
    </svg>
  );
}

function WifiIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 20h.01" />
      <path d="M2 8.82a15 15 0 0 1 20 0" />
      <path d="M5 12.859a10 10 0 0 1 14 0" />
      <path d="M8.5 16.429a5 5 0 0 1 7 0" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

function MapIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}
