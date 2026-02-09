'use client';

import { MapPin, Star, X } from 'lucide-react';
import { Map, MapMarker } from 'react-kakao-maps-sdk';
import { Badge } from '@/components/ui/badge';
import { RatingDisplay } from '@/components/ratings/rating-display';
import { MapProvider } from '@/components/map/map-provider';
import { useI18n } from '@/lib/i18n';
import { getLocalizedText } from '@/types/cafe';
import { getDistrictById } from '@/lib/constants/districts';
import { Wifi, Plug, Dog, Armchair, Car } from 'lucide-react';
import type { ForYouCafe } from '@/types/for-you';
import type { RatingDimension } from '@/lib/supabase/recommendations';

const FEATURE_BADGES = [
  { key: 'hasWifi' as const, icon: Wifi, label: 'WiFi' },
  { key: 'hasPowerOutlets' as const, icon: Plug, label: 'Outlets' },
  { key: 'isPetFriendly' as const, icon: Dog, label: 'Pet Friendly' },
  { key: 'isLaptopFriendly' as const, icon: Armchair, label: 'Laptop' },
  { key: 'hasParking' as const, icon: Car, label: 'Parking' },
] as const;

interface CafeCardInfoProps {
  cafe: ForYouCafe;
  showMap: boolean;
  onToggleMap: () => void;
  topDimensions: RatingDimension[];
}

export function CafeCardInfo({ cafe, showMap, onToggleMap, topDimensions }: CafeCardInfoProps) {
  const { t, language } = useI18n();
  const district = getDistrictById(cafe.districtId);
  const cafeName = getLocalizedText(cafe.name, language);
  const districtName = district ? getLocalizedText(district.name, language) : '';

  const activeFeatures = FEATURE_BADGES.filter((f) => cafe[f.key]);

  return (
    <>
      {/* Gradient overlay at bottom */}
      <div className="absolute bottom-0 left-0 right-0 z-10 pointer-events-none">
        <div className="bg-gradient-to-t from-black/80 via-black/40 to-transparent px-4 pb-4 pt-20">
          <div className="pointer-events-auto">
            {/* Name + district */}
            <h3 className="text-lg font-semibold leading-tight text-white drop-shadow-md">
              {cafeName}
            </h3>
            {districtName && (
              <p className="text-sm text-white/80 flex items-center gap-1 mt-0.5">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                {districtName}
              </p>
            )}

            {/* Rating */}
            <div className="mt-1.5 [&_*]:text-white [&_*]:!text-white/90">
              <RatingDisplay
                overallRating={cafe.overallRating}
                totalRatings={cafe.totalRatings}
              />
            </div>

            {/* Feature badges */}
            {activeFeatures.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {activeFeatures.map((f) => (
                  <Badge
                    key={f.key}
                    variant="secondary"
                    className="gap-1 text-xs bg-white/20 text-white border-white/20 backdrop-blur-sm"
                  >
                    <f.icon className="h-3 w-3" />
                    {f.label}
                  </Badge>
                ))}
              </div>
            )}

            {/* Top personalized ratings */}
            {topDimensions.length > 0 && (
              <div className="flex gap-3 mt-2.5">
                {topDimensions.map((dim) => {
                  const value = cafe.ratings[dim];
                  if (value == null) return null;
                  return (
                    <div key={dim} className="flex items-center gap-1.5">
                      <Star className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400" />
                      <span className="text-xs text-white/90 font-medium">
                        {value.toFixed(1)}
                      </span>
                      <span className="text-xs text-white/60">
                        {t(`rating.${dim}`)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Map drawer */}
      <div
        className={`absolute bottom-0 left-0 right-0 z-20 bg-background rounded-t-2xl shadow-2xl transition-transform duration-300 ease-out ${
          showMap ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{ height: '40dvh' }}
      >
        {/* Drawer handle + close */}
        <div className="flex items-center justify-between px-4 py-2 border-b">
          <div className="w-10 h-1 rounded-full bg-muted-foreground/30 mx-auto" />
          <button
            onClick={onToggleMap}
            className="absolute right-3 top-2 p-1 rounded-full hover:bg-muted transition-colors"
            aria-label={t('forYou.hideMap')}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Interactive map */}
        <div className="h-[calc(100%-2.5rem)]">
          {showMap && (
            <MapProvider>
              <Map
                center={{ lat: cafe.latitude, lng: cafe.longitude }}
                level={4}
                style={{ width: '100%', height: '100%' }}
                draggable={true}
                zoomable={true}
              >
                <MapMarker position={{ lat: cafe.latitude, lng: cafe.longitude }} />
              </Map>
            </MapProvider>
          )}
        </div>
      </div>
    </>
  );
}
