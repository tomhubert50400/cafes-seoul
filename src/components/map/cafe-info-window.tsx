'use client';

import { CustomOverlayMap } from 'react-kakao-maps-sdk';
import { X, MapPin } from 'lucide-react';
import { RatingDisplay } from '@/components/ratings/rating-display';
import { RatingButton } from '@/components/ratings/rating-button';
import type { CafeSummary } from '@/types/cafe';
import { useI18n } from '@/lib/i18n';
import { TodayHoursDisplay } from '@/components/hours/today-hours-display';

interface CafeInfoWindowProps {
  cafe: CafeSummary;
  onClose: () => void;
}

export function CafeInfoWindow({ cafe, onClose }: CafeInfoWindowProps) {
  const { t, language } = useI18n();
  
  const cafeName = cafe.name[language] || cafe.name.ko || cafe.name.en;
  const cafeAddress = cafe.address[language] || cafe.address.ko || cafe.address.en;

  return (
    <CustomOverlayMap
      position={{ lat: cafe.latitude, lng: cafe.longitude }}
      yAnchor={1.2}
      zIndex={1000}
    >
      {/* Wrap everything in an anchor tag for navigation */}
      <a 
        href={`/cafes/${cafe.slug}`}
        className="block no-underline"
        onClick={(e) => {
          // Let the default navigation happen
          console.log('Navigating to cafe:', cafe.slug);
        }}
      >
        <div className="relative min-w-[240px] max-w-[280px] rounded-lg border bg-white p-4 shadow-lg hover:shadow-xl transition-shadow">
          {/* Close button - stop propagation so it doesn't navigate */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClose();
            }}
            className="absolute right-2 top-2 rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors z-10"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Cafe name */}
          <h3 className="pr-6 font-semibold text-gray-900 line-clamp-2">
            {cafeName}
          </h3>

          {/* Rating */}
          <div className="mt-2 flex items-center justify-between">
            <RatingDisplay
              overallRating={cafe.overallRating}
              totalRatings={cafe.totalRatings}
              showStars={true}
              size="sm"
            />
            <RatingButton
              cafeId={cafe.id}
              cafeName={cafeName}
              cafeSlug={cafe.slug}
              size="sm"
              className="bg-foreground text-background hover:bg-foreground/90"
              redirectToPage
            />
          </div>

          {/* Address */}
          <div className="mt-2 flex items-start gap-1.5 text-sm text-muted-foreground">
            <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span className="line-clamp-2">{cafeAddress}</span>
          </div>

          {/* View details text */}
          <div className="mt-3 text-sm font-medium text-blue-600">
            View Details →
          </div>
        </div>
      </a>
    </CustomOverlayMap>
  );
}
