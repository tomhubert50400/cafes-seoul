'use client';

import Link from 'next/link';
import { Coffee, Star, MapPin, Filter } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n';

interface ReviewsEmptyStateProps {
  /** Whether user has ANY reviews (vs just filtered to zero) */
  hasAnyReviews: boolean;
  /** Callback to clear active filters */
  onClearFilters?: () => void;
  /** Popular cafes to suggest (for no-reviews state) */
  popularCafes?: Array<{
    slug: string;
    name: string;
  }>;
}

export function ReviewsEmptyState({
  hasAnyReviews,
  onClearFilters,
  popularCafes = [],
}: ReviewsEmptyStateProps) {
  const { t } = useI18n();

  // Filtered to zero - show clear filter option
  if (hasAnyReviews) {
    return (
      <Card className="mx-auto max-w-md">
        <CardContent className="py-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Filter className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">
            {t('reviews.emptyFiltered.title')}
          </h3>
          <p className="text-muted-foreground mb-6">
            {t('reviews.emptyFiltered.message')}
          </p>
          <Button variant="outline" onClick={onClearFilters}>
            {t('reviews.emptyFiltered.clearFilter')}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // No reviews at all - encouraging message + suggestions
  return (
    <Card className="mx-auto max-w-lg">
      <CardContent className="py-12 text-center">
        {/* Illustration using icons */}
        <div className="mx-auto mb-6 flex items-center justify-center gap-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-50">
            <Coffee className="h-6 w-6 text-amber-600" />
          </div>
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <Star className="h-7 w-7 text-primary" />
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-50">
            <MapPin className="h-6 w-6 text-green-600" />
          </div>
        </div>

        <h3 className="text-xl font-semibold mb-2">
          {t('reviews.emptyState.title')}
        </h3>
        <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
          {t('reviews.emptyState.message')}
        </p>

        <Button asChild>
          <Link href="/cafes">
            {t('reviews.emptyState.explore')}
          </Link>
        </Button>

        {/* Popular cafes suggestions */}
        {popularCafes.length > 0 && (
          <div className="mt-8 pt-6 border-t">
            <p className="text-sm text-muted-foreground mb-3">
              {t('reviews.popularCafes')}
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {popularCafes.slice(0, 3).map(cafe => (
                <Button key={cafe.slug} variant="ghost" size="sm" asChild>
                  <Link href={`/cafes/${cafe.slug}`}>
                    {cafe.name}
                  </Link>
                </Button>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
