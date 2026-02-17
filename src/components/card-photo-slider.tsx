'use client';

import { memo, useState, useRef, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CardPhotoSliderProps {
  photoUrls: string[];
  alt: string;
  sizes?: string;
  priority?: boolean;
  aspectRatio?: string;
}

export const CardPhotoSlider = memo(function CardPhotoSlider({
  photoUrls,
  alt,
  sizes = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw',
  priority = false,
  aspectRatio = 'aspect-[4/3]',
}: CardPhotoSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const didSwipeRef = useRef(false);
  const isHorizontalRef = useRef<boolean | null>(null);

  // Attach touch listeners with { passive: false } so preventDefault works
  useEffect(() => {
    const el = containerRef.current;
    if (!el || photoUrls.length <= 1) return;

    const onTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      touchStartRef.current = { x: touch.clientX, y: touch.clientY };
      didSwipeRef.current = false;
      isHorizontalRef.current = null;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!touchStartRef.current) return;
      const touch = e.touches[0];
      const dx = Math.abs(touch.clientX - touchStartRef.current.x);
      const dy = Math.abs(touch.clientY - touchStartRef.current.y);

      // Lock direction once we have enough movement
      if (isHorizontalRef.current === null && (dx > 8 || dy > 8)) {
        isHorizontalRef.current = dx > dy;
      }

      // If horizontal swipe, prevent page scroll
      if (isHorizontalRef.current) {
        e.preventDefault();
        didSwipeRef.current = true;
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (!touchStartRef.current) return;
      const touch = e.changedTouches[0];
      const dx = touch.clientX - touchStartRef.current.x;
      touchStartRef.current = null;

      if (isHorizontalRef.current && Math.abs(dx) > 30) {
        didSwipeRef.current = true;
        if (dx < 0) {
          setCurrentIndex((prev) => Math.min(photoUrls.length - 1, prev + 1));
        } else {
          setCurrentIndex((prev) => Math.max(0, prev - 1));
        }
      }
      isHorizontalRef.current = null;
    };

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd, { passive: true });

    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
    };
  }, [photoUrls.length]);

  // --- Mouse events (desktop drag) ---
  const mouseStartRef = useRef<{ x: number } | null>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    mouseStartRef.current = { x: e.clientX };
    didSwipeRef.current = false;
  }, []);

  const handleMouseUp = useCallback(
    (e: React.MouseEvent) => {
      if (!mouseStartRef.current) return;
      const dx = e.clientX - mouseStartRef.current.x;
      mouseStartRef.current = null;

      if (Math.abs(dx) > 30) {
        didSwipeRef.current = true;
        if (dx < 0) {
          setCurrentIndex((prev) => Math.min(photoUrls.length - 1, prev + 1));
        } else {
          setCurrentIndex((prev) => Math.max(0, prev - 1));
        }
      }
    },
    [photoUrls.length]
  );

  // Prevent parent Link navigation when swiping
  const handleClickCapture = useCallback((e: React.MouseEvent) => {
    if (didSwipeRef.current) {
      e.preventDefault();
      e.stopPropagation();
      didSwipeRef.current = false;
    }
  }, []);

  if (photoUrls.length === 0) return null;

  return (
    <div
      ref={containerRef}
      className={cn('relative overflow-hidden select-none', aspectRatio)}
      style={{ touchAction: 'pan-y' }}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onClickCapture={handleClickCapture}
    >
      {/* Sliding track */}
      <div
        className="flex h-full transition-transform duration-300 ease-out"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {photoUrls.map((url, i) => (
          <div key={i} className="relative h-full w-full shrink-0">
            <Image
              src={url}
              alt={`${alt} ${i + 1}`}
              fill
              className="object-cover"
              sizes={sizes}
              priority={priority && i === 0}
              draggable={false}
            />
          </div>
        ))}
      </div>

      {/* Desktop-only prev/next buttons */}
      {photoUrls.length > 1 && (
        <>
          {currentIndex > 0 && (
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setCurrentIndex((i) => i - 1); }}
              className="absolute left-1.5 top-1/2 z-10 hidden -translate-y-1/2 md:flex h-7 w-7 items-center justify-center rounded-full bg-white/80 text-zinc-700 shadow-sm opacity-0 transition-opacity group-hover:opacity-100 hover:bg-white"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          )}
          {currentIndex < photoUrls.length - 1 && (
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setCurrentIndex((i) => i + 1); }}
              className="absolute right-1.5 top-1/2 z-10 hidden -translate-y-1/2 md:flex h-7 w-7 items-center justify-center rounded-full bg-white/80 text-zinc-700 shadow-sm opacity-0 transition-opacity group-hover:opacity-100 hover:bg-white"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          )}
        </>
      )}

      {/* Preload adjacent image */}
      {currentIndex < photoUrls.length - 1 && (
        <link rel="preload" as="image" href={photoUrls[currentIndex + 1]} />
      )}

      {/* Dot indicators */}
      {photoUrls.length > 1 && (
        <div className="absolute bottom-2 left-1/2 z-10 flex -translate-x-1/2 gap-1">
          {photoUrls.map((_, i) => (
            <span
              key={i}
              className={cn(
                'h-1.5 w-1.5 rounded-full transition-colors',
                i === currentIndex ? 'bg-white' : 'bg-white/50'
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
});
