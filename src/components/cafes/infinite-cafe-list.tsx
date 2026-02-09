'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { CafeCard, CafeCardSkeleton } from '@/components/cafe-card';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { ArrowUp, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CafeSummary } from '@/types/cafe';
import type { CafeListParams, PaginatedResponse } from '@/types/api';

interface InfiniteCafeListProps {
  initialCafes: CafeSummary[];
  initialTotal: number;
  initialPage: number;
  totalPages: number;
  filterParams: Record<string, string | number | boolean | undefined>;
  favoriteIds: string[];
  userId?: string;
}

export function InfiniteCafeList({
  initialCafes,
  initialTotal,
  initialPage,
  totalPages,
  filterParams,
  favoriteIds,
  userId,
}: InfiniteCafeListProps) {
  const { t } = useI18n();
  const [cafes, setCafes] = useState<CafeSummary[]>(initialCafes);
  const [page, setPage] = useState(initialPage);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialPage < totalPages);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Reset when filters change (initialCafes changes)
  useEffect(() => {
    setCafes(initialCafes);
    setPage(initialPage);
    setHasMore(initialPage < totalPages);
  }, [initialCafes, initialPage, totalPages]);

  // Track scroll position for "back to top" button
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 600);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    const nextPage = page + 1;

    try {
      const params = new URLSearchParams();
      Object.entries(filterParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.set(key, String(value));
        }
      });
      params.set('page', String(nextPage));

      const res = await fetch(`/api/cafes?${params}`);
      if (!res.ok) throw new Error('Failed to fetch');

      const data: PaginatedResponse<CafeSummary> = await res.json();

      setCafes((prev) => [...prev, ...data.data]);
      setPage(nextPage);
      setHasMore(nextPage < data.meta.totalPages);
    } catch (error) {
      console.error('Error loading more cafes:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, hasMore, page, filterParams]);

  // IntersectionObserver for infinite scroll
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          loadMore();
        }
      },
      { rootMargin: '200px' }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, isLoading, loadMore]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (cafes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1}
          stroke="currentColor"
          className="h-16 w-16 text-zinc-300 dark:text-zinc-600"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
          />
        </svg>
        <p className="mt-4 text-lg font-medium text-muted-foreground">{t('cafes.noResults')}</p>
        <p className="mt-1 text-sm text-muted-foreground">{t('cafes.tryAgain')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Results count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{initialTotal}</span> {t('cafes.total')}
        </p>
      </div>

      {/* Cafe grid */}
      <div className="grid gap-4 overflow-hidden sm:grid-cols-2 lg:grid-cols-3">
        {cafes.map((cafe) => (
          <CafeCard
            key={cafe.id}
            cafe={cafe}
            isFavorited={favoriteIds?.includes(cafe.id)}
            userId={userId}
          />
        ))}

        {/* Loading skeletons */}
        {isLoading &&
          Array.from({ length: 3 }).map((_, i) => (
            <CafeCardSkeleton key={`skeleton-${i}`} />
          ))}
      </div>

      {/* Sentinel for intersection observer */}
      {hasMore && <div ref={sentinelRef} className="h-1" />}

      {/* Loading indicator */}
      {isLoading && (
        <div className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          {t('cafes.loadingMore')}
        </div>
      )}

      {/* End of list */}
      {!hasMore && cafes.length > 0 && (
        <p className="text-center text-sm text-muted-foreground">
          {t('cafes.allLoaded')}
        </p>
      )}

      {/* Scroll to top button */}
      <Button
        variant="outline"
        size="icon"
        onClick={scrollToTop}
        className={cn(
          'fixed bottom-6 right-6 z-50 h-10 w-10 rounded-full shadow-lg transition-all duration-300',
          showScrollTop ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0'
        )}
        aria-label={t('cafes.backToTop')}
      >
        <ArrowUp className="h-4 w-4" />
      </Button>
    </div>
  );
}
