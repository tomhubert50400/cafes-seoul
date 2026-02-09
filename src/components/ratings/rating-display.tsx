'use client';

import { RatingStars } from '@/components/rating-stars';
import { useI18n } from '@/lib/i18n';

interface RatingDisplayProps {
  overallRating: number;
  totalRatings: number;
  showStars?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function RatingDisplay({
  overallRating,
  totalRatings,
  showStars = true,
  size = 'sm',
  className,
}: RatingDisplayProps) {
  const { t } = useI18n();

  if (totalRatings === 0) {
    return (
      <span className="text-sm text-muted-foreground">
        {t('rating.noRatings')}
      </span>
    );
  }

  return (
    <div className={`flex items-center gap-1.5 ${className}`} aria-label={`${overallRating.toFixed(1)} out of 5 stars, ${totalRatings} ratings`}>
      {showStars && <RatingStars rating={overallRating} size={size} />}
      <span className="font-medium">{overallRating.toFixed(1)}</span>
      <span className="text-muted-foreground">
        ({t('rating.count').replace('{{count}}', String(totalRatings))})
      </span>
    </div>
  );
}
