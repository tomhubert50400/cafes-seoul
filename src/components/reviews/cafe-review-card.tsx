'use client';

import Link from 'next/link';
import { Star, Pencil } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AvatarDisplay } from '@/components/profile/avatar-display';
import { HelpfulButton } from './helpful-button';
import { useI18n } from '@/lib/i18n';
import type { ReviewWithAuthor } from '@/types/reviews';

interface CafeReviewCardProps {
  review: ReviewWithAuthor;
  userId: string | null;
}

export function CafeReviewCard({ review, userId }: CafeReviewCardProps) {
  const { language, t } = useI18n();

  // Format date
  const reviewDate = new Date(review.createdAt).toLocaleDateString(
    language === 'ko'
      ? 'ko-KR'
      : language === 'zh'
        ? 'zh-CN'
        : language === 'vi'
          ? 'vi-VN'
          : language === 'fr'
            ? 'fr-FR'
            : 'en-US',
    { year: 'numeric', month: 'short', day: 'numeric' }
  );

  // Format edited date if exists
  const editedDate = review.reviewEditedAt
    ? new Date(review.reviewEditedAt).toLocaleDateString(
        language === 'ko'
          ? 'ko-KR'
          : language === 'zh'
            ? 'zh-CN'
            : language === 'vi'
              ? 'vi-VN'
              : language === 'fr'
                ? 'fr-FR'
                : 'en-US',
        { year: 'numeric', month: 'short', day: 'numeric' }
      )
    : null;

  // Display name fallback to username
  const authorName = review.author.displayName || review.author.username;

  return (
    <Card className="overflow-hidden">
      <CardContent className="pt-4">
        {/* Header: Avatar + Author + Score + Date */}
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <AvatarDisplay
            userId={review.author.id}
            displayName={review.author.displayName}
            avatarUrl={review.author.avatarUrl}
            size="sm"
          />

          {/* Author info + Score */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Author name - link to profile if public */}
              {review.author.profilePublic ? (
                <Link
                  href={`/user/${review.author.id}`}
                  className="font-medium text-sm hover:underline"
                >
                  {authorName}
                </Link>
              ) : (
                <span className="font-medium text-sm">{authorName}</span>
              )}

              {/* Score pill */}
              <div className="flex items-center gap-0.5 rounded-full bg-primary/10 px-2 py-0.5">
                <Star className="h-3 w-3 fill-primary text-primary" />
                <span className="text-xs font-semibold text-primary">
                  {review.overall}
                </span>
              </div>
            </div>

            {/* Date */}
            <p className="text-xs text-muted-foreground mt-0.5">{reviewDate}</p>
          </div>
        </div>

        {/* Review text */}
        {review.reviewText && (
          <div className="mt-3">
            <p className="text-sm leading-relaxed whitespace-pre-line">
              {review.reviewText}
            </p>
          </div>
        )}

        {/* Footer: Edited badge + Helpful button */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t">
          {/* Edited badge */}
          <div>
            {review.reviewEditedAt && (
              <Badge
                variant="secondary"
                className="text-xs font-normal"
                title={editedDate || undefined}
              >
                <Pencil className="h-3 w-3 mr-1" />
                {t('reviews.cafe.edited')}
              </Badge>
            )}
          </div>

          {/* Helpful button */}
          <HelpfulButton
            ratingId={review.id}
            initialVoted={review.userHasVoted}
            initialCount={review.helpfulCount}
            isOwnReview={review.isOwnReview}
            isLoggedIn={!!userId}
          />
        </div>
      </CardContent>
    </Card>
  );
}
