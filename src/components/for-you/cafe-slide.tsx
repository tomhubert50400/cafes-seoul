'use client';

import { useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { Heart, MapPin, ExternalLink, Navigation } from 'lucide-react';
import { toast } from 'sonner';
import { PhotoCarousel } from './photo-carousel';
import { CafeCardInfo } from './cafe-card-info';
import { DirectionsChooser } from '@/components/directions-chooser';
import { useI18n } from '@/lib/i18n';
import { getLocalizedText } from '@/types/cafe';
import { ROUTES } from '@/lib/constants/routes';
import type { ForYouCafe } from '@/types/for-you';
import type { RatingDimension } from '@/lib/supabase/recommendations';

interface CafeSlideProps {
  cafe: ForYouCafe;
  isFavorited: boolean;
  isAuthenticated: boolean;
  onToggleFavorite: (cafeId: string) => void;
  topDimensions: RatingDimension[];
}

export function CafeSlide({
  cafe,
  isFavorited,
  isAuthenticated,
  onToggleFavorite,
  topDimensions,
}: CafeSlideProps) {
  const { t, language } = useI18n();
  const [showMap, setShowMap] = useState(false);
  const [heartAnim, setHeartAnim] = useState(false);
  const heartAnimRef = useRef(false);
  const cafeName = getLocalizedText(cafe.name, language);

  const handleFavorite = useCallback(() => {
    if (!isAuthenticated) {
      toast.error(t('forYou.loginToFavorite'));
      return;
    }
    onToggleFavorite(cafe.id);
  }, [isAuthenticated, onToggleFavorite, cafe.id, t]);

  const handleDoubleTap = useCallback(() => {
    if (!isAuthenticated) {
      toast.error(t('forYou.loginToFavorite'));
      return;
    }
    // Debounce: skip if animation already playing
    if (heartAnimRef.current) return;
    heartAnimRef.current = true;
    setHeartAnim(true);
    // Only favorite if not already favorited
    if (!isFavorited) {
      onToggleFavorite(cafe.id);
    }
  }, [isAuthenticated, isFavorited, onToggleFavorite, cafe.id, t]);

  return (
    <section className="relative h-[calc(100dvh-var(--safe-header-height))] w-full snap-start overflow-hidden">
      {/* Full-screen photo background */}
      <div className="absolute inset-0">
        <PhotoCarousel
          photoUrls={cafe.photoUrls}
          cafeName={cafeName}
          onDoubleTap={handleDoubleTap}
        />
      </div>

      {/* Double-tap heart animation */}
      {heartAnim && (
        <div
          className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none"
          onAnimationEnd={() => {
            setHeartAnim(false);
            heartAnimRef.current = false;
          }}
        >
          <Heart className="h-24 w-24 text-red-500 fill-red-500 heart-pop-animation" />
        </div>
      )}

      {/* Info overlay (gradient + badges + top ratings) */}
      <CafeCardInfo
        cafe={cafe}
        showMap={showMap}
        onToggleMap={() => setShowMap((v) => !v)}
        topDimensions={topDimensions}
      />

      {/* Floating action buttons - right side */}
      <div className="absolute right-3 bottom-[140px] z-10 flex flex-col gap-3">
        {/* Heart / Favorite */}
        <button
          onClick={handleFavorite}
          className="flex flex-col items-center gap-0.5"
          aria-label={isFavorited ? t('forYou.removedFromFavorites') : t('forYou.addedToFavorites')}
        >
          <div className="rounded-full bg-black/30 backdrop-blur-sm p-2.5">
            <Heart
              className={`h-6 w-6 transition-colors ${
                isFavorited ? 'text-red-500 fill-red-500' : 'text-white'
              }`}
            />
          </div>
        </button>

        {/* Map toggle */}
        <button
          onClick={() => setShowMap((v) => !v)}
          className="flex flex-col items-center gap-0.5"
          aria-label={t('forYou.showMap')}
        >
          <div className="rounded-full bg-black/30 backdrop-blur-sm p-2.5">
            <MapPin className="h-6 w-6 text-white" />
          </div>
        </button>

        {/* View details */}
        <Link
          href={ROUTES.CAFE_DETAIL(cafe.slug)}
          className="flex flex-col items-center gap-0.5"
          aria-label={t('forYou.viewDetails')}
        >
          <div className="rounded-full bg-black/30 backdrop-blur-sm p-2.5">
            <ExternalLink className="h-6 w-6 text-white" />
          </div>
        </Link>

        {/* Directions */}
        <DirectionsChooser
          address={cafe.address.ko || cafe.address.en || ''}
          latitude={cafe.latitude}
          longitude={cafe.longitude}
          trigger={
            <button
              className="flex flex-col items-center gap-0.5"
              aria-label={t('forYou.getDirections')}
            >
              <div className="rounded-full bg-black/30 backdrop-blur-sm p-2.5">
                <Navigation className="h-6 w-6 text-white" />
              </div>
            </button>
          }
        />
      </div>
    </section>
  );
}
