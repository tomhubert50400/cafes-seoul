'use client';

import { useMemo, useCallback } from 'react';
import { Map, MarkerClusterer, CustomOverlayMap } from 'react-kakao-maps-sdk';
import Image from 'next/image';
import Link from 'next/link';
import { X, Star, MapPin, Navigation, ExternalLink } from 'lucide-react';
import { CafeMarker } from './cafe-marker';
import { filterCafes } from '@/lib/utils/filter-cafes';
import { useI18n } from '@/lib/i18n';
import type { CafeSummary } from '@/types/cafe';
import type { MapFilters } from '@/types/map';

interface CafeMapProps {
  cafes: CafeSummary[];
  filters?: MapFilters;
  selectedCafe?: CafeSummary | null;
  onCafeSelect?: (cafe: CafeSummary | null) => void;
}

export function CafeMap({ cafes, filters, selectedCafe, onCafeSelect }: CafeMapProps) {
  const { t, language } = useI18n();

  // Filter cafes based on active filters
  const visibleCafes = useMemo(() => {
    if (!filters) return cafes;
    return filterCafes(cafes, filters);
  }, [cafes, filters]);

  const handleMarkerClick = useCallback((cafe: CafeSummary) => {
    onCafeSelect?.(cafe);
  }, [onCafeSelect]);

  const handleClose = useCallback(() => {
    onCafeSelect?.(null);
  }, [onCafeSelect]);

  // Get localized text for selected cafe
  const selectedCafeName = selectedCafe
    ? (selectedCafe.name[language] || selectedCafe.name.ko || selectedCafe.name.en)
    : '';
  const selectedCafeAddress = selectedCafe
    ? (selectedCafe.address[language] || selectedCafe.address.ko || selectedCafe.address.en)
    : '';
  const kakaoDirectionsUrl = selectedCafe
    ? `https://map.kakao.com/link/to/${encodeURIComponent(selectedCafeName)},${selectedCafe.latitude},${selectedCafe.longitude}`
    : '';

  return (
    <div className="relative h-full w-full min-h-[400px] md:min-h-0">
      <Map
        center={{ lat: 37.5665, lng: 126.9780 }}
        style={{ width: '100%', height: '100%', minHeight: '400px' }}
        level={7}
        onClick={() => handleClose()}
      >
        <MarkerClusterer
          averageCenter={true}
          minLevel={4}
          styles={[
            {
              width: '50px',
              height: '50px',
              background: 'rgba(59, 130, 246, 0.9)',
              borderRadius: '50%',
              color: '#fff',
              textAlign: 'center',
              lineHeight: '50px',
              fontSize: '14px',
              fontWeight: 'bold',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
            },
          ]}
        >
          {visibleCafes.map((cafe) => (
            <CafeMarker
              key={cafe.id}
              cafe={cafe}
              isSelected={selectedCafe?.id === cafe.id}
              onClick={() => handleMarkerClick(cafe)}
            />
          ))}
        </MarkerClusterer>

        {/* Info bubble - OUTSIDE the MarkerClusterer */}
        {selectedCafe && (
          <CustomOverlayMap
            position={{ lat: selectedCafe.latitude, lng: selectedCafe.longitude }}
            yAnchor={1.35}
            zIndex={100}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              className="relative"
            >
              <div className="bg-white rounded-xl shadow-xl border border-zinc-200 w-64 overflow-hidden">
                {/* Close button */}
                <button
                  onClick={handleClose}
                  className="absolute top-2 right-2 z-10 p-1.5 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>

                {/* Photo */}
                <div className="relative h-28 bg-zinc-100">
                  {selectedCafe.primaryImageUrl ? (
                    <Image
                      src={selectedCafe.primaryImageUrl}
                      alt={selectedCafeName}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-zinc-400">
                      <MapPin className="h-8 w-8" />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-3 space-y-2">
                  {/* Name */}
                  <h3 className="font-semibold text-sm leading-tight line-clamp-1 text-zinc-900">
                    {selectedCafeName}
                  </h3>

                  {/* Rating */}
                  <div className="flex items-center gap-1">
                    {selectedCafe.overallRating > 0 ? (
                      <>
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                        <span className="text-sm font-medium text-zinc-900">
                          {selectedCafe.overallRating.toFixed(1)}
                        </span>
                        <span className="text-xs text-zinc-500">
                          ({selectedCafe.totalRatings})
                        </span>
                      </>
                    ) : (
                      <span className="text-xs text-zinc-500">{t('rating.noRatings')}</span>
                    )}
                  </div>

                  {/* Address */}
                  <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed">
                    {selectedCafeAddress}
                  </p>

                  {/* View profile button */}
                  <Link
                    href={`/cafes/${selectedCafe.slug}`}
                    className="flex items-center justify-center gap-1.5 w-full py-2 px-3 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium rounded-lg transition-colors"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    {t('map.viewDetails')}
                  </Link>

                  {/* Get directions button */}
                  <a
                    href={kakaoDirectionsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 w-full py-2 px-3 bg-amber-500 hover:bg-amber-600 text-white text-xs font-medium rounded-lg transition-colors"
                  >
                    <Navigation className="h-3.5 w-3.5" />
                    {t('map.getDirections')}
                  </a>
                </div>
              </div>

              {/* Arrow pointing down */}
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-r border-b border-zinc-200 rotate-45" />
            </div>
          </CustomOverlayMap>
        )}
      </Map>
    </div>
  );
}
