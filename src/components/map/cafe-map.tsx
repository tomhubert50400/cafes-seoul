'use client';

import { useMemo, useCallback, useEffect, useRef } from 'react';
import { Map, MarkerClusterer, CustomOverlayMap, Circle } from 'react-kakao-maps-sdk';
import Image from 'next/image';
import Link from 'next/link';
import { X, Star, MapPin, Navigation, ExternalLink, Heart, Wifi, Plug, Laptop, PawPrint, Car } from 'lucide-react';
import { TodayHoursDisplay } from '@/components/hours/today-hours-display';
import { CafeMarker } from './cafe-marker';
import { FavoriteButton } from '@/components/favorites/favorite-button';
import { DirectionsChooser } from '@/components/directions-chooser';
import { filterCafes } from '@/lib/utils/filter-cafes';
import { useI18n } from '@/lib/i18n';
import type { CafeSummary } from '@/types/cafe';
import type { MapFilters } from '@/types/map';
import type { MetroStation } from '@/types/metro';
import { walkingMinutesToMeters } from '@/types/metro';

interface CafeMapProps {
  cafes: CafeSummary[];
  filters?: MapFilters;
  selectedCafe?: CafeSummary | null;
  onCafeSelect?: (cafe: CafeSummary | null) => void;
  favoriteIds?: string[];
  userId?: string;
  selectedStation?: MetroStation | null;
}

export function CafeMap({
  cafes,
  filters,
  selectedCafe,
  onCafeSelect,
  favoriteIds,
  userId,
  selectedStation,
}: CafeMapProps) {
  const { t, language } = useI18n();

  // Filter cafes based on active filters
  const visibleCafes = useMemo(() => {
    let result = cafes;

    // Apply existing filters first
    if (filters) {
      result = filterCafes(result, filters, selectedStation);
    }

    // Apply favorites filter
    if (filters?.showFavoritesOnly && favoriteIds?.length) {
      result = result.filter((cafe) => favoriteIds.includes(cafe.id));
    }

    return result;
  }, [cafes, filters, favoriteIds, selectedStation]);

  // Check if showing empty favorites state
  const showEmptyFavorites =
    filters?.showFavoritesOnly && visibleCafes.length === 0;

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

  // Compute map center based on selected station
  const mapCenter = selectedStation
    ? { lat: selectedStation.latitude, lng: selectedStation.longitude }
    : { lat: 37.5665, lng: 126.9780 };

  // Compute zoom level based on walking radius
  const mapLevel = selectedStation
    ? (filters?.walkingMinutes === 5 ? 4 : filters?.walkingMinutes === 15 ? 6 : 5)
    : 7;

  // Radius circle for station
  const stationRadius = selectedStation && filters?.walkingMinutes
    ? walkingMinutesToMeters(filters.walkingMinutes as 5 | 10 | 15)
    : selectedStation ? 800 : 0;

  return (
    <div className="relative h-full w-full min-h-[400px] md:min-h-0">
      <Map
        center={mapCenter}
        style={{ width: '100%', height: '100%', minHeight: '400px' }}
        level={mapLevel}
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
              isFavorited={favoriteIds?.includes(cafe.id)}
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
                {/* Action buttons */}
                <div className="absolute top-2 right-2 z-10 flex items-center gap-1">
                  {userId && (
                    <FavoriteButton
                      cafeId={selectedCafe.id}
                      initialIsFavorited={
                        favoriteIds?.includes(selectedCafe.id) ?? false
                      }
                      size="sm"
                      className="bg-black/50 hover:bg-black/70"
                    />
                  )}
                  <button
                    onClick={handleClose}
                    className="p-1.5 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>

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
                    <div className="flex flex-col items-center justify-center h-full text-zinc-400">
                      <MapPin className="h-6 w-6" />
                      <p className="text-xs mt-1">{t('cafe.noImage')}</p>
                      <Link
                        href={`/cafes/${selectedCafe.slug}?upload=true#photos-section`}
                        className="text-xs text-primary hover:underline mt-0.5"
                      >
                        {t('cafe.addFirstPhoto')}
                      </Link>
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

                  {/* Feature icons - only show when confirmed by user reviews */}
                  {selectedCafe.totalRatings > 0 && (() => {
                    const features = [
                      { key: 'hasWifi', icon: Wifi, active: selectedCafe.hasWifi },
                      { key: 'hasPowerOutlets', icon: Plug, active: selectedCafe.hasPowerOutlets },
                      { key: 'isLaptopFriendly', icon: Laptop, active: selectedCafe.isLaptopFriendly },
                      { key: 'isPetFriendly', icon: PawPrint, active: selectedCafe.isPetFriendly },
                      { key: 'hasParking', icon: Car, active: selectedCafe.hasParking },
                    ];
                    const activeFeatures = features.filter(f => f.active);
                    if (activeFeatures.length === 0) return null;
                    return (
                      <div className="flex gap-1.5">
                        {activeFeatures.map(({ key, icon: Icon }) => (
                          <div
                            key={key}
                            className="p-1 rounded-full border border-green-600 bg-green-50 text-green-600"
                          >
                            <Icon className="h-3 w-3" />
                          </div>
                        ))}
                      </div>
                    );
                  })()}

                  {/* Address */}
                  <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed">
                    {selectedCafeAddress}
                  </p>

                  {/* Today's hours */}
                  {selectedCafe.operatingHours && (
                    <TodayHoursDisplay operatingHours={selectedCafe.operatingHours} compact />
                  )}

                  {/* View profile button */}
                  <Link
                    href={`/cafes/${selectedCafe.slug}`}
                    className="flex items-center justify-center gap-1.5 w-full py-2 px-3 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium rounded-lg transition-colors"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    {t('map.viewDetails')}
                  </Link>

                  {/* Get directions button */}
                  <DirectionsChooser
                    address={selectedCafe.address.ko || selectedCafe.address.en || selectedCafeAddress}
                    latitude={selectedCafe.latitude}
                    longitude={selectedCafe.longitude}
                    trigger={
                      <button className="flex items-center justify-center gap-1.5 w-full py-2 px-3 bg-amber-500 hover:bg-amber-600 text-white text-xs font-medium rounded-lg transition-colors">
                        <Navigation className="h-3.5 w-3.5" />
                        {t('map.getDirections')}
                      </button>
                    }
                  />
                </div>
              </div>

              {/* Arrow pointing down */}
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-r border-b border-zinc-200 rotate-45" />
            </div>
          </CustomOverlayMap>
        )}
      </Map>

      {/* Empty favorites overlay */}
      {showEmptyFavorites && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-20 pointer-events-none">
          <div className="text-center p-6 pointer-events-auto">
            <Heart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {t('map.filters.noFavorites')}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {t('map.filters.browseCafes')}
            </p>
            <Link
              href="/cafes"
              className="inline-flex items-center justify-center px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              {t('nav.cafes')}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
