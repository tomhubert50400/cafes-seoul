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
  const pointerStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const didSwipeRef = useRef(false);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    pointerStartRef.current = { x: e.clientX, y: e.clientY, time: Date.now() };
    didSwipeRef.current = false;
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!pointerStartRef.current) return;
    const dx = Math.abs(e.clientX - pointerStartRef.current.x);
    if (dx > 10) {
      didSwipeRef.current = true;
    }
  }, []);

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!pointerStartRef.current) return;
      const dx = e.clientX - pointerStartRef.current.x;
      const absDx = Math.abs(dx);
      const absDy = Math.abs(e.clientY - pointerStartRef.current.y);
      pointerStartRef.current = null;

      // Only register horizontal swipe if > 30px and more horizontal than vertical
      if (absDx > 30 && absDx > absDy) {
        didSwipeRef.current = true;
        if (dx < 0) {
          // Swipe left -> next
          setCurrentIndex((prev) => Math.min(photoUrls.length - 1, prev + 1));
        } else {
          // Swipe right -> previous
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
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
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
