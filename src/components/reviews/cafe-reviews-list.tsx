'use client';

import { useState, useMemo } from 'react';
import { MessageSquare } from 'lucide-react';
import { CafeReviewCard } from './cafe-review-card';
import { RatingButton } from '@/components/ratings/rating-button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useI18n } from '@/lib/i18n';
import type { ReviewWithAuthor } from '@/types/reviews';

type SortOption = 'most-helpful' | 'date-new' | 'date-old' | 'rating-high' | 'rating-low';

interface CafeReviewsListProps {
  reviews: ReviewWithAuthor[];
  userId: string | null;
  isAdmin?: boolean;
  cafeId?: string;
  cafeName?: string;
  cafeSlug?: string;
}

export function CafeReviewsList({ reviews, userId, isAdmin = false, cafeId, cafeName, cafeSlug }: CafeReviewsListProps) {
  const { t } = useI18n();
  const [sortBy, setSortBy] = useState<SortOption>('date-new');

  // Filter to only reviews with text
  const textReviews = reviews.filter((r) => r.reviewText);

  const sortedReviews = useMemo(() => {
    return [...textReviews].sort((a, b) => {
      switch (sortBy) {
        case 'most-helpful':
          return b.helpfulCount - a.helpfulCount;
        case 'date-new':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'date-old':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'rating-high':
          return b.overall - a.overall;
        case 'rating-low':
          return a.overall - b.overall;
        default:
          return 0;
      }
    });
  }, [textReviews, sortBy]);

  if (textReviews.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <MessageSquare className="h-12 w-12 text-muted-foreground/50 mb-4" />
        <p className="text-muted-foreground">{t('reviews.cafe.noReviews')}</p>
        {cafeId && cafeName && cafeSlug && (
          <div className="mt-4">
            <RatingButton
              cafeId={cafeId}
              cafeName={cafeName}
              cafeSlug={cafeSlug}
              variant="outline"
              size="sm"
              className="gap-1.5"
              label={t('reviews.cafe.leaveReview')}
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {textReviews.length > 1 && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{t('reviews.sort.label')}</span>
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
            <SelectTrigger className="w-[160px] h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date-new">{t('reviews.sort.dateNew')}</SelectItem>
              <SelectItem value="date-old">{t('reviews.sort.dateOld')}</SelectItem>
              <SelectItem value="most-helpful">{t('reviews.sort.mostHelpful')}</SelectItem>
              <SelectItem value="rating-high">{t('reviews.sort.ratingHigh')}</SelectItem>
              <SelectItem value="rating-low">{t('reviews.sort.ratingLow')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
      {sortedReviews.map((review) => (
        <CafeReviewCard key={review.id} review={review} userId={userId} isAdmin={isAdmin} />
      ))}
    </div>
  );
}
