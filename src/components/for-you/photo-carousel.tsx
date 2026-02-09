'use client';

import { useState, useRef, useCallback } from 'react';
import { Camera } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

interface PhotoCarouselProps {
  photoUrls: string[];
  cafeName: string;
  onDoubleTap?: () => void;
}

export function PhotoCarousel({ photoUrls, cafeName, onDoubleTap }: PhotoCarouselProps) {
  const { t } = useI18n();
  const [currentIndex, setCurrentIndex] = useState(0);
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null);
  const lastTapRef = useRef(0);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    pointerStartRef.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!pointerStartRef.current) return;
      const dx = Math.abs(e.clientX - pointerStartRef.current.x);
      const dy = Math.abs(e.clientY - pointerStartRef.current.y);
      pointerStartRef.current = null;

      // Only register as tap if movement was small (< 10px)
      if (dx > 10 || dy > 10) return;

      const now = Date.now();
      if (onDoubleTap && now - lastTapRef.current < 300) {
        // Double tap
        onDoubleTap();
        lastTapRef.current = 0;
        return;
      }
      lastTapRef.current = now;

      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const tapX = e.clientX - rect.left;
      const tapRatio = tapX / rect.width;

      if (tapRatio < 0.4) {
        // Left 40% - previous
        setCurrentIndex((prev) => Math.max(0, prev - 1));
      } else {
        // Right 60% - next
        setCurrentIndex((prev) => Math.min(photoUrls.length - 1, prev + 1));
      }
    },
    [photoUrls.length, onDoubleTap]
  );

  // Fallback: no photos
  if (photoUrls.length === 0) {
    return (
      <div className="h-full w-full bg-muted flex flex-col items-center justify-center gap-2">
        <Camera className="h-12 w-12 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground/50">{t('photos.empty.title')}</p>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full select-none overflow-hidden bg-black">
      {/* Progress bars */}
      {photoUrls.length > 1 && (
        <div className="absolute top-2 left-2 right-2 z-10 flex gap-1">
          {photoUrls.map((_, i) => (
            <div
              key={i}
              className="h-0.5 flex-1 rounded-full overflow-hidden bg-white/30"
            >
              <div
                className={`h-full rounded-full transition-all duration-200 ${
                  i <= currentIndex ? 'w-full bg-white' : 'w-0'
                }`}
              />
            </div>
          ))}
        </div>
      )}

      {/* Current photo */}
      <img
        src={photoUrls[currentIndex]}
        alt={`${cafeName} photo ${currentIndex + 1}`}
        className="h-full w-full object-cover"
        draggable={false}
      />

      {/* Tap zones */}
      <div
        className="absolute inset-0 z-[5]"
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
      />
    </div>
  );
}
