'use client';

import { RatingDisplay } from './rating-display';
import { RatingButton } from './rating-button';
import { useI18n } from '@/lib/i18n';
import type { Cafe } from '@/types/cafe';
import type { UserRating } from '@/types/ratings';
import { RATING_DIMENSION_LABELS, RATING_SECTIONS, RATING_SECTION_LABELS } from '@/types/ratings';

interface RatingsSectionProps {
  cafe: Cafe;
  userRating?: UserRating | null;
  onRatingSubmitted?: () => void;
}

export function RatingsSection({ cafe, userRating, onRatingSubmitted }: RatingsSectionProps) {
  const { t, language } = useI18n();

  const hasRatings = cafe.totalRatings > 0;

  // Helper to render a dimension bar
  const renderDimension = (key: string, value: number | null | undefined) => {
    if (value === null || value === undefined || value === 0) return null;
    const label = RATING_DIMENSION_LABELS[key as keyof typeof RATING_DIMENSION_LABELS];
    const labelText = label?.[language as 'en' | 'ko'] || label?.en || key;
    const percentage = (value / 5) * 100;

    return (
      <div key={key} className="space-y-1">
        <div className="flex justify-between text-sm">
          <span>{labelText}</span>
          <span className="font-medium">{value.toFixed(1)}</span>
        </div>
        <div className="h-2 rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    );
  };

  return (
    <section className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-semibold">{t('rating.sectionTitle')}</h2>
          {hasRatings ? (
            <RatingDisplay
              overallRating={cafe.overallRating}
              totalRatings={cafe.totalRatings}
              size="md"
              className="mt-1"
            />
          ) : (
            <p className="mt-1 text-muted-foreground">{t('rating.beFirst')}</p>
          )}
        </div>
        <RatingButton
          cafeId={cafe.id}
          cafeName={cafe.name[language] || cafe.name.en}
          cafeSlug={cafe.slug}
          existingRating={userRating}
          onRatingSubmitted={onRatingSubmitted}
        />
      </div>

      {/* Breakdown */}
      {hasRatings && (
        <div className="space-y-6">
          {/* Essentials */}
          <div className="space-y-3">
            <h3 className="font-medium text-muted-foreground">
              {RATING_SECTION_LABELS.essentials[language as 'en' | 'ko'] || RATING_SECTION_LABELS.essentials.en}
            </h3>
            <div className="space-y-3">
              {RATING_SECTIONS.essentials.map(key => 
                renderDimension(key, cafe.ratings[key as keyof typeof cafe.ratings])
              )}
            </div>
          </div>

          {/* Comfort */}
          <div className="space-y-3">
            <h3 className="font-medium text-muted-foreground">
              {RATING_SECTION_LABELS.comfort[language as 'en' | 'ko'] || RATING_SECTION_LABELS.comfort.en}
            </h3>
            <div className="space-y-3">
              {RATING_SECTIONS.comfort.map(key => 
                renderDimension(key, cafe.ratings[key as keyof typeof cafe.ratings])
              )}
            </div>
          </div>

          {/* Extras */}
          <div className="space-y-3">
            <h3 className="font-medium text-muted-foreground">
              {RATING_SECTION_LABELS.extras[language as 'en' | 'ko'] || RATING_SECTION_LABELS.extras.en}
            </h3>
            <div className="space-y-3">
              {RATING_SECTIONS.extras.map(key => 
                renderDimension(key, cafe.ratings[key as keyof typeof cafe.ratings])
              )}
            </div>
          </div>
        </div>
      )}

      {/* User's Rating Indicator */}
      {userRating && (
        <div className="rounded-lg bg-muted p-4">
          <p className="text-sm text-muted-foreground">
            {t('rating.youRated')} {t('rating.overall')}: {userRating.overall}/5
          </p>
        </div>
      )}
    </section>
  );
}
