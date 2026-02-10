'use client';

import { MessageSquare } from 'lucide-react';
import { CafeReviewCard } from './cafe-review-card';
import { RatingButton } from '@/components/ratings/rating-button';
import { useI18n } from '@/lib/i18n';
import type { ReviewWithAuthor } from '@/types/reviews';

interface CafeReviewsListProps {
  reviews: ReviewWithAuthor[];
  userId: string | null;
  cafeId?: string;
  cafeName?: string;
  cafeSlug?: string;
}

export function CafeReviewsList({ reviews, userId, cafeId, cafeName, cafeSlug }: CafeReviewsListProps) {
  const { t } = useI18n();

  // Filter to only reviews with text
  const textReviews = reviews.filter((r) => r.reviewText);

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
      {textReviews.map((review) => (
        <CafeReviewCard key={review.id} review={review} userId={userId} />
      ))}
    </div>
  );
}
