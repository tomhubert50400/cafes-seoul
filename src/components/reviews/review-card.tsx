'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ChevronDown, Star, ExternalLink, Coffee, Pencil, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';
import { getLocalizedText } from '@/types/cafe';
import { getDimensionLabel } from '@/lib/utils/ratings';
import { deleteReviewTextAction } from '@/lib/actions/reviews';
import { ReviewEditForm } from '@/components/reviews/review-edit-form';
import { DeleteReviewTextDialog } from '@/components/reviews/delete-review-text-dialog';
import type { UserRatingWithImage, OptionalRatingDimension } from '@/types/ratings';

interface ReviewCardProps {
  review: UserRatingWithImage;
}

export function ReviewCard({ review }: ReviewCardProps) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { language, t } = useI18n();

  const cafeName = getLocalizedText(review.cafe.name, language);
  const ratedDate = new Date(review.createdAt).toLocaleDateString(
    language === 'ko' ? 'ko-KR' : language === 'zh' ? 'zh-CN' : language === 'vi' ? 'vi-VN' : language === 'fr' ? 'fr-FR' : 'en-US',
    { year: 'numeric', month: 'short', day: 'numeric' }
  );

  // Get all rated dimensions (non-zero values)
  const dimensions: OptionalRatingDimension[] = [
    'drinks', 'service', 'priceValue', 'quietness',
    'seating', 'comfort', 'food', 'lighting', 'aesthetic'
  ];
  const ratedDimensions = dimensions.filter(dim => review[dim] > 0);

  const hasReviewText = !!review.reviewText;
  const wasEdited = !!review.reviewEditedAt;

  const handleSave = () => {
    setIsEditing(false);
    router.refresh();
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteReviewTextAction(review.id);

      if (result.success) {
        toast.success(t('reviews.card.reviewDeleted'));
        router.refresh();
      } else {
        toast.error(result.error || t('reviews.card.deleteError'));
      }
    });
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
    if (!expanded) {
      setExpanded(true);
    }
  };

  const handleAddReviewClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
    if (!expanded) {
      setExpanded(true);
    }
  };

  return (
    <Card className="transition-shadow hover:shadow-md overflow-hidden">
      <CardHeader
        className="cursor-pointer pb-3 !block"
        onClick={() => !isEditing && setExpanded(!expanded)}
      >
        <div className="flex items-start gap-3 w-full">
          {/* Cafe thumbnail */}
          <div className="relative h-12 w-12 sm:h-16 sm:w-16 shrink-0 overflow-hidden rounded-lg bg-muted">
            {review.cafe.primaryImageUrl ? (
              <Image
                src={review.cafe.primaryImageUrl}
                alt={cafeName}
                fill
                className="object-cover"
                sizes="64px"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <Coffee className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Card info + score */}
          <div className="flex-1 min-w-0">
            {/* Top row: name + score + chevron */}
            <div className="flex items-center gap-2 w-full">
              <h3 className="font-semibold text-sm sm:text-lg truncate min-w-0 flex-1">{cafeName}</h3>
              <div className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 sm:px-3 sm:py-1.5 shrink-0">
                <Star className="h-3 w-3 sm:h-4 sm:w-4 fill-primary text-primary" />
                <span className="text-xs sm:text-base font-semibold text-primary">{review.overall}</span>
              </div>
              <ChevronDown
                className={cn(
                  "h-4 w-4 text-muted-foreground transition-transform duration-200 shrink-0",
                  expanded && "rotate-180"
                )}
              />
            </div>
            {/* Date row */}
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 truncate">
              {t('reviews.card.ratedOn')}: {ratedDate}
            </p>
          </div>
        </div>
      </CardHeader>

      {/* Expanded content */}
      <div
        className={cn(
          "overflow-hidden transition-all duration-200",
          expanded ? "max-h-[800px] opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <CardContent className="pt-0 border-t">
          {/* Review text section */}
          <div className="mt-4">
            {isEditing ? (
              <ReviewEditForm
                ratingId={review.id}
                initialText={review.reviewText || ''}
                onSave={handleSave}
                onCancel={handleCancel}
              />
            ) : hasReviewText ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-medium text-muted-foreground">
                      {t('reviews.card.yourReview')}
                    </h4>
                    {wasEdited && (
                      <Badge variant="secondary" className="text-xs">
                        {t('reviews.card.edited')}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleEditClick}
                    >
                      <Pencil className="h-4 w-4" />
                      <span className="sr-only">{t('reviews.card.editReview')}</span>
                    </Button>
                    <DeleteReviewTextDialog
                      onConfirm={handleDelete}
                      isPending={isPending}
                    />
                  </div>
                </div>
                <p className="text-sm whitespace-pre-wrap">{review.reviewText}</p>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddReviewClick}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-1" />
                {t('reviews.card.addReview')}
              </Button>
            )}
          </div>

          {/* Dimension scores */}
          {ratedDimensions.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-muted-foreground mb-3">
                {t('reviews.card.dimensions')}
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {ratedDimensions.map(dim => (
                  <div
                    key={dim}
                    className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2"
                  >
                    <span className="text-sm capitalize">
                      {getDimensionLabel(dim, language)}
                    </span>
                    <div className="flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      <span className="text-sm font-medium">{review[dim]}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pet friendly indicator */}
          {review.petFriendly && (
            <div className="mt-3 text-sm text-muted-foreground">
              Pet-friendly
            </div>
          )}

          {/* View cafe button */}
          <div className="mt-4 pt-3 border-t">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/cafes/${review.cafe.slug}`}>
                {t('reviews.card.viewCafe')}
                <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </div>
    </Card>
  );
}
