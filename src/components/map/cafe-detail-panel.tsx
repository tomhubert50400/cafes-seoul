'use client';

import Link from 'next/link';
import { X, MapPin, Clock, Star, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RatingDisplay } from '@/components/ratings/rating-display';
import { RatingButton } from '@/components/ratings/rating-button';
import type { CafeSummary } from '@/types/cafe';
import { useI18n } from '@/lib/i18n';

interface CafeDetailPanelProps {
  cafe: CafeSummary;
  onClose: () => void;
}

export function CafeDetailPanel({ cafe, onClose }: CafeDetailPanelProps) {
  const { t, language } = useI18n();

  const cafeName = cafe.name[language] || cafe.name.ko || cafe.name.en;
  const cafeAddress = cafe.address[language] || cafe.address.ko || cafe.address.en;

  return (
    <div className="flex h-full max-h-[80vh] flex-col md:max-h-full">
      {/* Header */}
      <div className="flex items-start justify-between border-b p-4">
        <div className="flex-1 pr-2">
          <h2 className="text-lg font-semibold line-clamp-2">{cafeName}</h2>
          <div className="mt-1">
            <RatingDisplay
              overallRating={cafe.overallRating}
              totalRatings={cafe.totalRatings}
              showStars={true}
              size="sm"
            />
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-11 w-11 shrink-0"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">{t('common.close')}</span>
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Address */}
        <div className="flex items-start gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
          <span className="break-words">{cafeAddress}</span>
        </div>

        {/* Features */}
        {(cafe.hasWifi || cafe.hasPowerOutlets || cafe.isPetFriendly) && (
          <div className="flex flex-wrap gap-2">
            {cafe.hasWifi && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                WiFi
              </span>
            )}
            {cafe.hasPowerOutlets && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                {t('cafe.powerOutlets')}
              </span>
            )}
            {cafe.isPetFriendly && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                {t('cafe.petFriendly')}
              </span>
            )}
          </div>
        )}

        {/* Rating breakdown preview */}
        {cafe.ratings && (
          <div className="grid grid-cols-2 gap-2 text-sm">
            {cafe.ratings.wifi != null && cafe.ratings.wifi > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t('rating.wifi')}</span>
                <span className="flex items-center gap-1">
                  {cafe.ratings.wifi.toFixed(1)}
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                </span>
              </div>
            )}
            {cafe.ratings.seating != null && cafe.ratings.seating > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t('rating.seating')}</span>
                <span className="flex items-center gap-1">
                  {cafe.ratings.seating.toFixed(1)}
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                </span>
              </div>
            )}
            {cafe.ratings.quietness != null && cafe.ratings.quietness > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t('rating.quietness')}</span>
                <span className="flex items-center gap-1">
                  {cafe.ratings.quietness.toFixed(1)}
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                </span>
              </div>
            )}
            {cafe.ratings.drinks != null && cafe.ratings.drinks > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t('rating.drinks')}</span>
                <span className="flex items-center gap-1">
                  {cafe.ratings.drinks.toFixed(1)}
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="p-4 border-t space-y-2">
        <Button asChild className="w-full">
          <Link href={`/cafes/${cafe.slug}`}>
            {t('map.viewDetails')}
            <ExternalLink className="ml-2 h-4 w-4" />
          </Link>
        </Button>
        <RatingButton
          cafeId={cafe.id}
          cafeName={cafeName}
          cafeSlug={cafe.slug}
          className="w-full bg-foreground text-background hover:bg-foreground/90"
          redirectToPage
        />
      </div>
    </div>
  );
}
