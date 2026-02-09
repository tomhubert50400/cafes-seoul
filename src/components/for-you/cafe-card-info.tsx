'use client';

import Link from 'next/link';
import { MapPin, Navigation, Wifi, Plug, Dog, Armchair, Car } from 'lucide-react';
import { Map, MapMarker } from 'react-kakao-maps-sdk';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RatingDisplay } from '@/components/ratings/rating-display';
import { MapProvider } from '@/components/map/map-provider';
import { DirectionsChooser } from '@/components/directions-chooser';
import { useI18n } from '@/lib/i18n';
import { getLocalizedText } from '@/types/cafe';
import { getDistrictById } from '@/lib/constants/districts';
import { ROUTES } from '@/lib/constants/routes';
import type { ForYouCafe } from '@/types/for-you';

const FEATURE_BADGES = [
  { key: 'hasWifi' as const, icon: Wifi, label: 'WiFi' },
  { key: 'hasPowerOutlets' as const, icon: Plug, label: 'Outlets' },
  { key: 'isPetFriendly' as const, icon: Dog, label: 'Pet Friendly' },
  { key: 'isLaptopFriendly' as const, icon: Armchair, label: 'Laptop' },
  { key: 'hasParking' as const, icon: Car, label: 'Parking' },
] as const;

interface CafeCardInfoProps {
  cafe: ForYouCafe;
}

export function CafeCardInfo({ cafe }: CafeCardInfoProps) {
  const { t, language } = useI18n();
  const district = getDistrictById(cafe.districtId);
  const cafeName = getLocalizedText(cafe.name, language);
  const districtName = district ? getLocalizedText(district.name, language) : '';

  const activeFeatures = FEATURE_BADGES.filter((f) => cafe[f.key]);

  return (
    <div
      className="flex-1 overflow-y-auto px-4 py-3 space-y-3"
      style={{ touchAction: 'pan-y' }}
    >
      {/* Name + district */}
      <div>
        <h3 className="text-lg font-semibold leading-tight">{cafeName}</h3>
        {districtName && (
          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            {districtName}
          </p>
        )}
      </div>

      {/* Rating */}
      <RatingDisplay
        overallRating={cafe.overallRating}
        totalRatings={cafe.totalRatings}
      />

      {/* Feature badges */}
      {activeFeatures.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {activeFeatures.map((f) => (
            <Badge key={f.key} variant="secondary" className="gap-1 text-xs">
              <f.icon className="h-3 w-3" />
              {f.label}
            </Badge>
          ))}
        </div>
      )}

      {/* Mini map */}
      <div className="rounded-lg overflow-hidden border h-[150px]">
        <MapProvider>
          <Map
            center={{ lat: cafe.latitude, lng: cafe.longitude }}
            level={4}
            style={{ width: '100%', height: '100%' }}
            draggable={false}
            zoomable={false}
          >
            <MapMarker position={{ lat: cafe.latitude, lng: cafe.longitude }} />
          </Map>
        </MapProvider>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-2">
        <Button variant="outline" size="sm" asChild className="min-h-[44px]">
          <Link href={ROUTES.CAFE_DETAIL(cafe.slug)}>
            {t('forYou.viewDetails')}
          </Link>
        </Button>
        <DirectionsChooser
          address={cafe.address.ko || cafe.address.en || ''}
          latitude={cafe.latitude}
          longitude={cafe.longitude}
          trigger={
            <Button variant="outline" size="sm" className="gap-1.5 min-h-[44px]">
              <Navigation className="h-3.5 w-3.5" />
              {t('forYou.getDirections')}
            </Button>
          }
        />
      </div>
    </div>
  );
}
