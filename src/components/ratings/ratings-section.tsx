'use client';

import { RatingDisplay } from './rating-display';
import { RatingButton } from './rating-button';
import { useI18n } from '@/lib/i18n';
import type { Cafe } from '@/types/cafe';
import type { UserRating } from '@/types/ratings';
import { RATING_DIMENSION_LABELS } from '@/types/ratings';

interface RatingsSectionProps {
  cafe: Cafe;
  userRating?: UserRating | null;
  onRatingSubmitted?: () => void;
}

// Ordre d'affichage des dimensions
const DIMENSION_ORDER = [
  'drinks',
  'wifi', 
  'priceValue',
  'quietness',
  'seating',
  'comfort',
  'food',
  'lighting',
  'outlets'
];

export function RatingsSection({ cafe, userRating, onRatingSubmitted }: RatingsSectionProps) {
  const { t, language } = useI18n();

  const hasRatings = cafe.totalRatings > 0;

  // Helper to render a dimension bar
  const renderDimension = (key: string) => {
    const value = cafe.ratings[key as keyof typeof cafe.ratings];
    const hasValue = value !== null && value !== undefined && value > 0;
    
    const label = RATING_DIMENSION_LABELS[key as keyof typeof RATING_DIMENSION_LABELS];
    const labelText = label?.[language as 'en' | 'ko'] || label?.en || key;
    const percentage = hasValue ? (value / 5) * 100 : 0;

    return (
      <div 
        key={key} 
        className={`space-y-2 p-3 rounded-lg border ${hasValue ? 'bg-card border-border' : 'bg-muted/50 border-transparent'}`}
      >
        <div className="flex items-center justify-between">
          <span className={`text-sm font-medium ${hasValue ? 'text-foreground' : 'text-muted-foreground'}`}>
            {labelText}
          </span>
          <span className={`text-sm font-semibold ${hasValue ? 'text-foreground' : 'text-muted-foreground'}`}>
            {hasValue ? value.toFixed(1) : '-'}
          </span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${hasValue ? 'bg-primary' : 'bg-transparent'}`}
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

      {/* Breakdown - Grid Layout */}
      {hasRatings && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {DIMENSION_ORDER.map(key => renderDimension(key))}
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
