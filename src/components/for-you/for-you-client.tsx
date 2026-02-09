'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { CafeSlide } from './cafe-slide';
import { EmptyState } from './empty-state';
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

  // Track pending changes to sync later
  const pendingAdded = useRef(new Set<string>());
  const pendingRemoved = useRef(new Set<string>());

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

  // Flush pending favorites to server
  const flushFavorites = useCallback(() => {
    const added = Array.from(pendingAdded.current);
    const removed = Array.from(pendingRemoved.current);
    if (added.length === 0 && removed.length === 0) return;

    // Clear pending sets immediately to avoid double-flush
    pendingAdded.current.clear();
    pendingRemoved.current.clear();

    const payload = JSON.stringify({ added, removed });

    // Use sendBeacon for reliable delivery during page unload
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/favorites/sync', new Blob([payload], { type: 'application/json' }));
    } else {
      // Fallback for older browsers
      fetch('/api/favorites/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        keepalive: true,
      });
    }
  }, []);

  // Flush on page unload or tab hide
  useEffect(() => {
    const handleBeforeUnload = () => flushFavorites();
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') flushFavorites();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      // Flush on component unmount (e.g. client-side navigation)
      flushFavorites();
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [flushFavorites]);

  const handleToggleFavorite = useCallback(
    (cafeId: string) => {
      setFavoriteIdSet((prev) => {
        const next = new Set(prev);
        if (next.has(cafeId)) {
          // Un-favorite
          next.delete(cafeId);
          // Track for sync: if it was a newly added one, just cancel; otherwise mark removed
          if (pendingAdded.current.has(cafeId)) {
            pendingAdded.current.delete(cafeId);
          } else {
            pendingRemoved.current.add(cafeId);
          }
          toast(t('forYou.removedFromFavorites'));
        } else {
          // Favorite
          next.add(cafeId);
          // Track for sync: if it was pending removal, cancel; otherwise mark added
          if (pendingRemoved.current.has(cafeId)) {
            pendingRemoved.current.delete(cafeId);
          } else {
            pendingAdded.current.add(cafeId);
          }
          toast.success(t('forYou.addedToFavorites'));
        }
        return next;
      });
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
          topDimensions={topDimensions}
        />
      ))}

      {/* Empty state as last slide */}
      <div className="h-[calc(100dvh-3.5rem)] w-full snap-start flex items-center justify-center">
        <EmptyState isAuthenticated={isAuthenticated} />
      </div>
    </div>
  );
}
