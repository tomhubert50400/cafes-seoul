'use client';

import { MessageSquare } from 'lucide-react';
import { CafeReviewCard } from './cafe-review-card';
import { useI18n } from '@/lib/i18n';
import type { ReviewWithAuthor } from '@/types/reviews';

interface CafeReviewsListProps {
  reviews: ReviewWithAuthor[];
  userId: string | null;
}

export function CafeReviewsList({ reviews, userId }: CafeReviewsListProps) {
  const { t } = useI18n();

  // Filter to only reviews with text
  const textReviews = reviews.filter((r) => r.reviewText);

  if (textReviews.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <MessageSquare className="h-12 w-12 text-muted-foreground/50 mb-4" />
        <p className="text-muted-foreground">{t('reviews.cafe.noReviews')}</p>
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
