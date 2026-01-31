'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Star, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/lib/constants/routes';
import { toast } from 'sonner';

// ============================================
// TYPES
// ============================================

interface Rating {
  id: string;
  overall: number;
  created_at: string;
  cafe: {
    id: string;
    name: { en?: string; ko?: string };
    slug: string;
  } | null;
}

interface RatingsListProps {
  ratings: Rating[];
  totalCount: number;
  userId: string;
  translations: {
    empty: string;
    emptyCta: string;
    loadMore: string;
    remaining: string;
  };
}

// ============================================
// RATINGS LIST COMPONENT
// ============================================

export function RatingsList({
  ratings: initialRatings,
  totalCount,
  userId,
  translations,
}: RatingsListProps) {
  const [ratings, setRatings] = useState(initialRatings);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Load more ratings
  const handleLoadMore = async () => {
    if (isLoadingMore) return;
    setIsLoadingMore(true);

    try {
      const response = await fetch(
        `/api/dashboard/ratings?offset=${ratings.length}&limit=5`
      );
      if (!response.ok) throw new Error('Failed to load more ratings');

      const newRatings = await response.json();
      setRatings((prev) => [...prev, ...newRatings]);
    } catch (error) {
      console.error('Error loading more ratings:', error);
      toast.error('Failed to load more ratings');
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Empty state
  if (ratings.length === 0) {
    return (
      <div className="mt-4 rounded-lg border border-dashed p-8 text-center">
        <p className="text-sm text-muted-foreground">{translations.empty}</p>
        <Button asChild className="mt-4" variant="outline">
          <Link href={ROUTES.CAFES}>{translations.emptyCta}</Link>
        </Button>
      </div>
    );
  }

  const hasMore = ratings.length < totalCount;
  const remainingCount = totalCount - ratings.length;

  return (
    <div className="mt-4 space-y-3">
      {ratings.map((rating) => {
        // Handle cafe data - may be array or object depending on Supabase response
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
              <div className="flex-1">
                <p className="font-medium">{cafeName}</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(rating.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-1 text-lg font-bold">
                <span>{rating.overall}</span>
                <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
              </div>
            </div>
          </Link>
        );
      })}

      {/* Load More button */}
      {hasMore && (
        <div className="flex justify-center pt-4">
          <Button
            variant="outline"
            onClick={handleLoadMore}
            disabled={isLoadingMore}
          >
            {isLoadingMore ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                {translations.loadMore}{' '}
                <span className="ml-1 text-muted-foreground">
                  ({remainingCount} {translations.remaining})
                </span>
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
