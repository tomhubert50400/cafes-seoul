'use client';

import { useState, useMemo } from 'react';
import { useI18n } from '@/lib/i18n';
import { ReviewCard } from './review-card';
import { ReviewsEmptyState } from './reviews-empty-state';
import { ReviewStats } from './review-stats';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { UserRatingWithImage } from '@/types/ratings';

type SortOption = 'rating-high' | 'rating-low' | 'date-new' | 'date-old';

interface MyReviewsListProps {
  reviews: UserRatingWithImage[];
  popularCafes?: Array<{ slug: string; name: string }>;
}

export function MyReviewsList({ reviews, popularCafes = [] }: MyReviewsListProps) {
  const { t } = useI18n();

  // Sort/filter state - default: highest rated first per CONTEXT.md
  const [sortBy, setSortBy] = useState<SortOption>('rating-high');
  const [minScore, setMinScore] = useState(1);

  // Apply sorting and filtering client-side
  const filteredReviews = useMemo(() => {
    return reviews
      .filter(r => r.overall >= minScore)
      .sort((a, b) => {
        switch (sortBy) {
          case 'rating-high':
            return b.overall - a.overall;
          case 'rating-low':
            return a.overall - b.overall;
          case 'date-new':
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          case 'date-old':
            return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          default:
            return 0;
        }
      });
  }, [reviews, sortBy, minScore]);

  const clearFilters = () => {
    setMinScore(1);
    setSortBy('rating-high');
  };

  const hasActiveFilter = minScore > 1;

  // No reviews at all
  if (reviews.length === 0) {
    return (
      <ReviewsEmptyState
        hasAnyReviews={false}
        popularCafes={popularCafes}
      />
    );
  }

  return (
    <div>
      {/* Sort/Filter controls */}
      <div className="mb-6 flex flex-wrap items-center gap-4">
        {/* Sort dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{t('reviews.sort.label')}:</span>
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="rating-high">{t('reviews.sort.ratingHigh')}</SelectItem>
              <SelectItem value="rating-low">{t('reviews.sort.ratingLow')}</SelectItem>
              <SelectItem value="date-new">{t('reviews.sort.dateNew')}</SelectItem>
              <SelectItem value="date-old">{t('reviews.sort.dateOld')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Min score filter slider */}
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">{t('reviews.filter.minScore')}:</span>
          <Slider
            value={[minScore]}
            onValueChange={([v]) => setMinScore(v)}
            min={1}
            max={5}
            step={1}
            className="w-24"
          />
          <span className="text-sm font-medium w-4">{minScore}</span>
        </div>
      </div>

      {/* Filtered to zero - show empty state with clear option */}
      {filteredReviews.length === 0 && hasActiveFilter ? (
        <ReviewsEmptyState
          hasAnyReviews={true}
          onClearFilters={clearFilters}
        />
      ) : (
        <>
          {/* Review cards list */}
          <div className="space-y-4">
            {filteredReviews.map(review => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>

          {/* Stats footer */}
          <ReviewStats
            allReviews={reviews}
            filteredReviews={filteredReviews}
          />
        </>
      )}
    </div>
  );
}
