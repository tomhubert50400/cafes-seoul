'use client';

import { useState, useCallback, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { SwipeableCard } from './swipeable-card';
import { EmptyState } from './empty-state';
import { toggleFavoriteAction } from '@/lib/actions/favorites';
import { useI18n } from '@/lib/i18n';
import type { ForYouCafe } from '@/types/for-you';

interface ForYouClientProps {
  cafes: ForYouCafe[];
  favoriteIds: string[];
  isAuthenticated: boolean;
}

const HINT_STORAGE_KEY = 'for-you-swipe-hint-shown';

export function ForYouClient({
  cafes: initialCafes,
  favoriteIds: initialFavoriteIds,
  isAuthenticated,
}: ForYouClientProps) {
  const { t } = useI18n();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [favoriteIdSet, setFavoriteIdSet] = useState(
    () => new Set(initialFavoriteIds)
  );
  const [showHint, setShowHint] = useState(false);

  // Filter out already-favorited cafes
  const cafes = initialCafes.filter((c) => !favoriteIdSet.has(c.id) || currentIndex > 0);

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

  const advance = useCallback(() => {
    setCurrentIndex((prev) => prev + 1);
  }, []);

  const handleSwipeLeft = useCallback(() => {
    advance();
  }, [advance]);

  const handleSwipeRight = useCallback(async () => {
    const cafe = cafes[currentIndex];
    if (!cafe) return;

    if (!isAuthenticated) {
      toast.error(t('forYou.loginToFavorite'));
      advance();
      return;
    }

    // Optimistically advance
    advance();

    const result = await toggleFavoriteAction(cafe.id);
    if (result.success && result.isFavorited) {
      toast.success(t('forYou.addedToFavorites'));
      setFavoriteIdSet((prev) => new Set(prev).add(cafe.id));
    } else if (result.success && !result.isFavorited) {
      // Was already favorited, toggle removed it - re-add
      toast(t('forYou.removedFromFavorites'));
    } else if (result.error) {
      toast.error(result.error);
    }
  }, [cafes, currentIndex, isAuthenticated, advance, t]);

  // Keyboard support
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (currentIndex >= cafes.length) return;
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handleSwipeLeft();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleSwipeRight();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, cafes.length, handleSwipeLeft, handleSwipeRight]);

  // Deck exhausted
  if (currentIndex >= cafes.length) {
    return <EmptyState isAuthenticated={isAuthenticated} />;
  }

  const currentCafe = cafes[currentIndex];
  const nextCafe = cafes[currentIndex + 1];

  return (
    <div className="relative mx-auto w-full max-w-md h-[calc(100dvh-4.5rem)]">
      {/* Swipe hint */}
      {showHint && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-black/70 text-white text-sm px-4 py-2 rounded-full backdrop-blur-sm animate-in fade-in">
          {t('forYou.swipeHint')}
        </div>
      )}

      {/* Card stack */}
      <AnimatePresence>
        {nextCafe && (
          <SwipeableCard
            key={nextCafe.id}
            cafe={nextCafe}
            onSwipeLeft={() => {}}
            onSwipeRight={() => {}}
            isBehind
          />
        )}
        <SwipeableCard
          key={currentCafe.id}
          cafe={currentCafe}
          onSwipeLeft={handleSwipeLeft}
          onSwipeRight={handleSwipeRight}
        />
      </AnimatePresence>
    </div>
  );
}
