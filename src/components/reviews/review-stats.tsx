'use client';

import { useI18n } from '@/lib/i18n';
import { getDimensionLabel } from '@/lib/utils/ratings';
import type { UserRatingWithImage, OptionalRatingDimension } from '@/types/ratings';

interface ReviewStatsProps {
  /** All user reviews (unfiltered) */
  allReviews: UserRatingWithImage[];
  /** Currently displayed reviews (after filtering) */
  filteredReviews: UserRatingWithImage[];
}

export function ReviewStats({ allReviews, filteredReviews }: ReviewStatsProps) {
  const { t, language } = useI18n();

  const totalCount = allReviews.length;
  const shownCount = filteredReviews.length;

  // Calculate average overall rating from filtered reviews
  const avgOverall = shownCount > 0
    ? (filteredReviews.reduce((sum, r) => sum + r.overall, 0) / shownCount).toFixed(1)
    : '0';

  // Calculate per-dimension averages (only for dimensions that have ratings)
  const dimensions: OptionalRatingDimension[] = [
    'drinks', 'service', 'priceValue', 'quietness',
    'seating', 'comfort', 'food', 'lighting', 'aesthetic'
  ];

  const dimensionAverages = dimensions.map(dim => {
    const ratedReviews = filteredReviews.filter(r => r[dim] > 0);
    if (ratedReviews.length === 0) return null;
    const avg = ratedReviews.reduce((sum, r) => sum + r[dim], 0) / ratedReviews.length;
    return { dim, avg: avg.toFixed(1), count: ratedReviews.length };
  }).filter(Boolean) as Array<{ dim: OptionalRatingDimension; avg: string; count: number }>;

  if (totalCount === 0) return null;

  return (
    <div className="mt-8 rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
        {/* Count display */}
        <div>
          {shownCount !== totalCount ? (
            <span>
              {t('reviews.stats.shown')} <strong className="text-foreground">{shownCount}</strong> {t('reviews.stats.of')} {totalCount}
            </span>
          ) : (
            <span>
              {t('reviews.stats.total')}: <strong className="text-foreground">{totalCount}</strong>
            </span>
          )}
        </div>

        {/* Average overall */}
        <div className="border-l pl-6">
          {t('reviews.stats.avgOverall')}: <strong className="text-foreground">{avgOverall}</strong>
        </div>

        {/* Per-dimension averages (compact) */}
        {dimensionAverages.length > 0 && (
          <div className="hidden sm:flex items-center gap-3 border-l pl-6">
            {dimensionAverages.slice(0, 5).map(({ dim, avg }) => (
              <span key={dim}>
                {getDimensionLabel(dim, language)}: <strong className="text-foreground">{avg}</strong>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
