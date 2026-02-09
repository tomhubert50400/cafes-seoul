'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { CafeSlide } from './cafe-slide';
import { EmptyState } from './empty-state';
import { toggleFavoriteAction } from '@/lib/actions/favorites';
import { useI18n } from '@/lib/i18n';
import type { ForYouCafe } from '@/types/for-you';
import type { RatingDimension } from '@/lib/supabase/recommendations';

interface ForYouClientProps {
  cafes: ForYouCafe[];
  favoriteIds: string[];
  isAuthenticated: boolean;
  topDimensions: RatingDimension[];
}

const HINT_STORAGE_KEY = 'for-you-scroll-hint-shown';

export function ForYouClient({
  cafes,
  favoriteIds: initialFavoriteIds,
  isAuthenticated,
  topDimensions,
}: ForYouClientProps) {
  const { t } = useI18n();
  const [favoriteIdSet, setFavoriteIdSet] = useState(
    () => new Set(initialFavoriteIds)
  );
  const [showHint, setShowHint] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Show first-time hint
  useEffect(() => {
    if (cafes.length > 0 && !localStorage.getItem(HINT_STORAGE_KEY)) {
      setShowHint(true);
      const timer = setTimeout(() => {
        setShowHint(false);
        localStorage.setItem(HINT_STORAGE_KEY, '1');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleToggleFavorite = useCallback(
    async (cafeId: string) => {
      const result = await toggleFavoriteAction(cafeId);
      if (result.success && result.isFavorited) {
        toast.success(t('forYou.addedToFavorites'));
        setFavoriteIdSet((prev) => new Set(prev).add(cafeId));
      } else if (result.success && !result.isFavorited) {
        toast(t('forYou.removedFromFavorites'));
        setFavoriteIdSet((prev) => {
          const next = new Set(prev);
          next.delete(cafeId);
          return next;
        });
      } else if (result.error) {
        toast.error(result.error);
      }
    },
    [t]
  );

  if (cafes.length === 0) {
    return <EmptyState isAuthenticated={isAuthenticated} />;
  }

  return (
    <div
      ref={scrollRef}
      className="h-[calc(100dvh-3.5rem)] overflow-y-auto snap-y snap-mandatory"
      style={{ scrollSnapType: 'y mandatory' }}
    >
      {/* Scroll hint */}
      {showHint && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-black/70 text-white text-sm px-4 py-2 rounded-full backdrop-blur-sm animate-in fade-in">
          {t('forYou.swipeHint')}
        </div>
      )}

      {cafes.map((cafe) => (
        <CafeSlide
          key={cafe.id}
          cafe={cafe}
          isFavorited={favoriteIdSet.has(cafe.id)}
          isAuthenticated={isAuthenticated}
          onToggleFavorite={handleToggleFavorite}
        />
      ))}

      {/* Empty state as last slide */}
      <div className="h-[calc(100dvh-3.5rem)] w-full snap-start flex items-center justify-center">
        <EmptyState isAuthenticated={isAuthenticated} />
      </div>
    </div>
  );
}
