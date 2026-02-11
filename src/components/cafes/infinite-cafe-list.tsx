'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { CafeCard, CafeCardSkeleton } from '@/components/cafe-card';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { ArrowUp, Loader2, Search } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
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
    prefetchedRef.current = null;
    // Prefetch page 2 right after initial render
    if (initialPage < totalPages) {
      prefetchNext(initialPage, totalPages);
    }
  }, [initialCafes, initialPage, totalPages, prefetchNext]);

  // Track scroll position for "back to top" button
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 600);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Prefetched data cache for next page
  const prefetchedRef = useRef<{ page: number; data: PaginatedResponse<CafeSummary> } | null>(null);

  const buildParams = useCallback((pageNum: number) => {
    const params = new URLSearchParams();
    Object.entries(filterParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.set(key, String(value));
      }
    });
    params.set('page', String(pageNum));
    return params;
  }, [filterParams]);

  // Prefetch next page in background after current page loads
  const prefetchNext = useCallback(async (currentPage: number, currentTotalPages: number) => {
    const nextPage = currentPage + 1;
    if (nextPage > currentTotalPages) return;
    if (prefetchedRef.current?.page === nextPage) return;

    try {
      const res = await fetch(`/api/cafes?${buildParams(nextPage)}`);
      if (res.ok) {
        prefetchedRef.current = { page: nextPage, data: await res.json() };
      }
    } catch {
      // Silent fail - prefetch is best-effort
    }
  }, [buildParams]);

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    const nextPage = page + 1;

    try {
      let data: PaginatedResponse<CafeSummary>;

      // Use prefetched data if available for this page
      if (prefetchedRef.current?.page === nextPage) {
        data = prefetchedRef.current.data;
        prefetchedRef.current = null;
      } else {
        const res = await fetch(`/api/cafes?${buildParams(nextPage)}`);
        if (!res.ok) throw new Error('Failed to fetch');
        data = await res.json();
      }

      setCafes((prev) => {
        const existingIds = new Set(prev.map((c) => c.id));
        const newCafes = data.data.filter((c) => !existingIds.has(c.id));
        return [...prev, ...newCafes];
      });
      setPage(nextPage);
      setHasMore(nextPage < data.meta.totalPages);

      // Prefetch the page after this one
      prefetchNext(nextPage, data.meta.totalPages);
    } catch (error) {
      console.error('Error loading more cafes:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, hasMore, page, buildParams, prefetchNext]);

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
        {cafes.map((cafe, index) => (
          <CafeCard
            key={cafe.id}
            cafe={cafe}
            isFavorited={favoriteIds?.includes(cafe.id)}
            userId={userId}
            priority={index < 6}
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
