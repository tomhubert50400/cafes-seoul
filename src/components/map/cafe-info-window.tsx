'use client';

import { CustomOverlayMap } from 'react-kakao-maps-sdk';
import Link from 'next/link';
import { X, Star, MapPin } from 'lucide-react';
import type { CafeSummary } from '@/types/cafe';
import { useI18n } from '@/lib/i18n';

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
      zIndex={10}
    >
      <div className="relative min-w-[200px] max-w-[260px] sm:min-w-[240px] sm:max-w-[280px] rounded-lg border bg-white p-3 sm:p-4 shadow-lg">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-2 top-2 rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Cafe name */}
        <h3 className="pr-6 font-semibold text-gray-900 line-clamp-2">
          {cafeName}
        </h3>

        {/* Rating */}
        {cafe.overallRating > 0 && (
          <div className="mt-1 flex items-center gap-1 text-sm">
            <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
            <span className="font-medium">{cafe.overallRating.toFixed(1)}</span>
            <span className="text-muted-foreground">({cafe.totalRatings})</span>
          </div>
        )}

        {/* Address */}
        <div className="mt-2 flex items-start gap-1.5 text-sm text-muted-foreground">
          <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span className="line-clamp-2">{cafeAddress}</span>
        </div>

        {/* View details link */}
        <Link
          href={`/cafes/${cafe.slug}`}
          className="mt-3 inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline"
        >
          View Details →
        </Link>
      </div>
    </CustomOverlayMap>
  );
}
