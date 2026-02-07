'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useI18n } from '@/lib/i18n';
import { getLocalizedText } from '@/types/cafe';
import type { CafeSummary } from '@/types/cafe';

interface RouletteSpinnerProps {
  cafes: CafeSummary[];
  winner: CafeSummary;
  onComplete: () => void;
}

const REEL_SIZE = 50;
const ITEM_WIDTH = 120;
const WINNER_INDEX = 43;
const ANIMATION_DURATION = 5;

export function RouletteSpinner({ cafes, winner, onComplete }: RouletteSpinnerProps) {
  const { t, language } = useI18n();
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    if (containerRef.current) {
      setContainerWidth(containerRef.current.offsetWidth);
    }
  }, []);

  const reel = useMemo(() => {
    const items: CafeSummary[] = [];
    const pool = cafes.filter((c) => c.id !== winner.id);

    for (let i = 0; i < REEL_SIZE; i++) {
      if (i === WINNER_INDEX) {
        items.push(winner);
      } else if (pool.length > 0) {
        items.push(pool[Math.floor(Math.random() * pool.length)]);
      } else {
        items.push(winner);
      }
    }
    return items;
  }, [cafes, winner]);

  const jitter = useMemo(() => Math.random() * (ITEM_WIDTH * 0.4) - ITEM_WIDTH * 0.2, []);
  const targetX = -(WINNER_INDEX * ITEM_WIDTH) + (containerWidth / 2) - (ITEM_WIDTH / 2) + jitter;

  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, (ANIMATION_DURATION + 0.5) * 1000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="flex flex-col items-center py-4 md:py-8">
      <p className="text-sm text-muted-foreground mb-4">{t('roulette.spinning')}</p>

      {/* CS:GO-style horizontal reel */}
      <div ref={containerRef} className="relative w-full overflow-hidden">
        {/* Center indicator - triangle + line */}
        <div className="absolute left-1/2 -translate-x-1/2 top-0 -mt-2 z-20">
          <div className="w-0 h-0 border-l-[8px] border-r-[8px] border-t-[10px] border-l-transparent border-r-transparent border-t-primary" />
        </div>
        <div className="absolute left-1/2 -translate-x-1/2 bottom-0 -mb-2 z-20">
          <div className="w-0 h-0 border-l-[8px] border-r-[8px] border-b-[10px] border-l-transparent border-r-transparent border-b-primary" />
        </div>
        <div className="absolute left-1/2 -translate-x-px top-0 bottom-0 w-0.5 bg-primary z-20 pointer-events-none" />

        {/* Reel viewport */}
        <div className="overflow-hidden rounded-lg border bg-background/80 backdrop-blur">
          {/* Fade edges */}
          <div className="absolute inset-y-0 left-0 w-12 sm:w-16 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
          <div className="absolute inset-y-0 right-0 w-12 sm:w-16 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

          {containerWidth > 0 && (
            <motion.div
              className="flex"
              initial={{ x: 0 }}
              animate={{ x: targetX }}
              transition={{
                duration: ANIMATION_DURATION,
                ease: [0.12, 0.8, 0.2, 1],
              }}
            >
              {reel.map((cafe, i) => (
                <div
                  key={`${cafe.id}-${i}`}
                  className="flex-shrink-0 flex flex-col items-center justify-center gap-1.5 border-r border-border/50 py-3"
                  style={{ width: ITEM_WIDTH }}
                >
                  <div className="h-14 w-14 rounded-md bg-muted overflow-hidden">
                    {cafe.primaryImageUrl ? (
                      <img
                        src={cafe.primaryImageUrl}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center bg-muted text-muted-foreground/50">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17 8h1a4 4 0 1 1 0 8h-1" />
                          <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <span className="text-[11px] font-medium leading-tight text-center px-1 truncate w-full">
                    {getLocalizedText(cafe.name, language)}
                  </span>
                </div>
              ))}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
