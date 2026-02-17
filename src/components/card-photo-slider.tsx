'use client';

import { memo, useState, useRef, useCallback } from 'react';
import Image from 'next/image';
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
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const didSwipeRef = useRef(false);
  // Track if touch direction is determined to be horizontal
  const isHorizontalRef = useRef<boolean | null>(null);

  // --- Touch events (mobile) ---
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    didSwipeRef.current = false;
    isHorizontalRef.current = null;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const touch = e.touches[0];
    const dx = Math.abs(touch.clientX - touchStartRef.current.x);
    const dy = Math.abs(touch.clientY - touchStartRef.current.y);

    // Once we have enough movement, lock the direction
    if (isHorizontalRef.current === null && (dx > 8 || dy > 8)) {
      isHorizontalRef.current = dx > dy;
    }

    // If horizontal swipe, prevent vertical scroll
    if (isHorizontalRef.current) {
      e.preventDefault();
      didSwipeRef.current = true;
    }
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!touchStartRef.current) return;
      const touch = e.changedTouches[0];
      const dx = touch.clientX - touchStartRef.current.x;
      const absDx = Math.abs(dx);
      touchStartRef.current = null;

      if (isHorizontalRef.current && absDx > 30) {
        didSwipeRef.current = true;
        if (dx < 0) {
          setCurrentIndex((prev) => Math.min(photoUrls.length - 1, prev + 1));
        } else {
          setCurrentIndex((prev) => Math.max(0, prev - 1));
        }
      }
      isHorizontalRef.current = null;
    },
    [photoUrls.length]
  );

  // --- Mouse events (desktop) ---
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
      className={cn('relative overflow-hidden select-none', aspectRatio)}
      style={{ touchAction: 'pan-y' }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
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
          <div key={url} className="relative h-full w-full shrink-0">
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
