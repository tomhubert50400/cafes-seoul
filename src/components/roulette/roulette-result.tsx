'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { MapPin, Navigation, Wifi, Plug, Dog, Armchair, Car, RotateCw, Camera, Plus, ExternalLink } from 'lucide-react';
import { Map, MapMarker } from 'react-kakao-maps-sdk';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RatingDisplay } from '@/components/ratings/rating-display';
import { MapProvider } from '@/components/map/map-provider';
import { DirectionsChooser } from '@/components/directions-chooser';
import { useI18n } from '@/lib/i18n';
import { getLocalizedText } from '@/types/cafe';
import { getDistrictById } from '@/lib/constants/districts';
import { ROUTES } from '@/lib/constants/routes';
import type { CafeSummary } from '@/types/cafe';
import type { MapFilters } from '@/types/map';
import { TodayHoursDisplay } from '@/components/hours/today-hours-display';

interface RouletteResultProps {
  cafe: CafeSummary;
  filters: MapFilters;
  onSpinAgain: () => void;
  onAdjustFilters: () => void;
}

const FEATURE_BADGES = [
  { key: 'hasWifi' as const, filterKey: 'hasWifi' as const, icon: Wifi, label: 'WiFi' },
  { key: 'hasPowerOutlets' as const, filterKey: 'hasPowerOutlets' as const, icon: Plug, label: 'Outlets' },
  { key: 'isPetFriendly' as const, filterKey: 'isPetFriendly' as const, icon: Dog, label: 'Pet Friendly' },
  { key: 'isLaptopFriendly' as const, filterKey: 'isLaptopFriendly' as const, icon: Armchair, label: 'Laptop' },
  { key: 'hasParking' as const, filterKey: 'hasParking' as const, icon: Car, label: 'Parking' },
] as const;

export function RouletteResult({
  cafe,
  filters,
  onSpinAgain,
  onAdjustFilters,
}: RouletteResultProps) {
  const { t, language } = useI18n();
  const district = getDistrictById(cafe.districtId);
  const cafeName = getLocalizedText(cafe.name, language);
  const districtName = district ? getLocalizedText(district.name, language) : '';

  // Filter for matched boolean features that were active in filters
  const matchedFeatures = FEATURE_BADGES.filter(
    (f) => filters[f.filterKey] && cafe[f.key]
  );


  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="overflow-hidden py-0 gap-0">
        <CardContent className="p-0">
          {/* Header */}
          <div className="px-4 py-5 sm:p-6 text-center">
            <h2 className="text-2xl font-bold mb-1">{t('roulette.matchTitle')}</h2>
            <p className="text-muted-foreground text-sm">{t('roulette.matchSubtitle')}</p>
          </div>

          {/* Cafe image */}
          {cafe.primaryImageUrl ? (
            <div className="aspect-video w-full overflow-hidden">
              <img
                src={cafe.primaryImageUrl}
                alt={cafeName}
                className="h-full w-full object-cover"
              />
            </div>
          ) : (
            <Link
              href={`${ROUTES.CAFE_DETAIL(cafe.slug)}?upload=true#photos-section`}
              className="aspect-video w-full bg-zinc-100 dark:bg-zinc-800 flex flex-col items-center justify-center gap-2 transition-colors hover:bg-zinc-200 dark:hover:bg-zinc-700"
            >
              <div className="relative">
                <Camera className="h-10 w-10 text-zinc-400 dark:text-zinc-500" />
                <div className="absolute top-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-zinc-400 dark:bg-zinc-500">
                  <Plus className="h-3 w-3 text-white" />
                </div>
              </div>
              <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{t('cafe.noImage')}</p>
              <p className="text-xs text-zinc-500/90 dark:text-zinc-400/90">{t('cafe.addFirstPhoto')}</p>
            </Link>
          )}

          {/* Details */}
          <div className="px-4 py-5 sm:p-6 space-y-4">
            {/* Name + district */}
            <div>
              <h3 className="text-xl font-semibold">{cafeName}</h3>
              {districtName && (
                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {districtName}
                </p>
              )}
            </div>

            {/* Today's hours */}
            <TodayHoursDisplay operatingHours={cafe.operatingHours} />

            {/* Rating */}
            <RatingDisplay
              overallRating={cafe.overallRating}
              totalRatings={cafe.totalRatings}
            />

            {/* Matched filter tags */}
            {matchedFeatures.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
                  {t('roulette.matchedFilters')}
                </p>
                <div className="flex flex-wrap gap-2">
                  {matchedFeatures.map((f) => (
                    <Badge key={f.key} variant="secondary" className="gap-1">
                      <f.icon className="h-3 w-3" />
                      {f.label}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Static map */}
            <div className="rounded-lg overflow-hidden border h-[200px]">
              <MapProvider>
                <Map
                  center={{ lat: cafe.latitude, lng: cafe.longitude }}
                  level={3}
                  style={{ width: '100%', height: '100%' }}
                  draggable={true}
                  zoomable={true}
                >
                  <MapMarker position={{ lat: cafe.latitude, lng: cafe.longitude }} />
                </Map>
              </MapProvider>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <DirectionsChooser
                address={cafe.address.ko || cafe.address.en || ''}
                latitude={cafe.latitude}
                longitude={cafe.longitude}
                trigger={
                  <Button className="gap-2 min-w-0 min-h-[44px]">
                    <Navigation className="h-4 w-4 shrink-0" />
                    <span className="truncate">{t('roulette.getDirections')}</span>
                  </Button>
                }
              />
              <Button variant="outline" asChild className="min-w-0 min-h-[44px]">
                <Link href={ROUTES.CAFE_DETAIL(cafe.slug)}>
                  <ExternalLink className="h-4 w-4" />
                  <span className="truncate">{t('roulette.viewProfile')}</span>
                </Link>
              </Button>
            </div>

            {/* Footer buttons */}
            <div className="flex flex-col gap-2 border-t">
              <Button onClick={onSpinAgain} className="min-h-[44px]">
                <RotateCw className="h-4 w-4" />
                {t('roulette.spinAgain')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
