'use client';

import { useState, useMemo, useCallback, useRef } from 'react';
import { useI18n } from '@/lib/i18n';
import { useMapFilters } from '@/hooks/use-map-filters';
import { filterCafes } from '@/lib/utils/filter-cafes';
import { RouletteIdle } from './roulette-idle';
import { RouletteSpinner } from './roulette-spinner';
import { RouletteResult } from './roulette-result';
import { RouletteFilterSheet } from './roulette-filter-sheet';
import type { CafeSummary } from '@/types/cafe';

type Phase = 'idle' | 'spinning' | 'result';

interface RouletteClientProps {
  cafes: CafeSummary[];
}

function selectRandomCafe(
  cafes: CafeSummary[],
  recentIds: Set<string>
): CafeSummary {
  // Filter out recently shown cafes if possible
  const candidates = cafes.length > recentIds.size
    ? cafes.filter((c) => !recentIds.has(c.id))
    : cafes;

  // Weighted random by overallRating (min weight 0.5 for unrated)
  const weights = candidates.map((c) => Math.max(c.overallRating, 0.5));
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);

  let random = Math.random() * totalWeight;
  for (let i = 0; i < candidates.length; i++) {
    random -= weights[i];
    if (random <= 0) return candidates[i];
  }

  return candidates[candidates.length - 1];
}

export function RouletteClient({ cafes }: RouletteClientProps) {
  const { t } = useI18n();
  const {
    filters,
    updateFilter,
    clearFilters,
    activeFilterCount,
  } = useMapFilters();

  const [phase, setPhase] = useState<Phase>('idle');
  const [selectedCafe, setSelectedCafe] = useState<CafeSummary | null>(null);
  const recentIdsRef = useRef<Set<string>>(new Set());

  const filteredCafes = useMemo(
    () => filterCafes(cafes, { ...filters, showFavoritesOnly: false }),
    [cafes, filters]
  );

  const handleSpin = useCallback(() => {
    if (filteredCafes.length === 0) return;

    const winner = selectRandomCafe(filteredCafes, recentIdsRef.current);
    recentIdsRef.current.add(winner.id);

    // Keep recent IDs set from growing unbounded
    if (recentIdsRef.current.size > Math.floor(filteredCafes.length / 2)) {
      recentIdsRef.current.clear();
      recentIdsRef.current.add(winner.id);
    }

    setSelectedCafe(winner);
    setPhase('spinning');
  }, [filteredCafes]);

  const handleSpinComplete = useCallback(() => {
    setPhase('result');
  }, []);

  const handleSpinAgain = useCallback(() => {
    setPhase('idle');
    setSelectedCafe(null);
  }, []);

  const handleAdjustFilters = useCallback(() => {
    setPhase('idle');
    setSelectedCafe(null);
  }, []);

  return (
    <div className="space-y-6">
      {/* Page title */}
      <div className="text-center">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{t('roulette.title')}</h1>
        <p className="text-muted-foreground mt-2">{t('roulette.subtitle')}</p>
      </div>

      {/* Filter bar */}
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground shrink-0">
          {t('roulette.cafeCount').replace('{{count}}', String(filteredCafes.length))}
        </p>
        <RouletteFilterSheet
          filters={filters}
          activeFilterCount={activeFilterCount}
          onUpdateFilter={updateFilter}
          onClearFilters={clearFilters}
        />
      </div>

      {/* Phase content */}
      {phase === 'idle' && (
        <RouletteIdle
          cafeCount={filteredCafes.length}
          onSpin={handleSpin}
          onClearFilters={clearFilters}
        />
      )}

      {phase === 'spinning' && selectedCafe && (
        <RouletteSpinner
          cafes={filteredCafes}
          winner={selectedCafe}
          onComplete={handleSpinComplete}
        />
      )}

      {phase === 'result' && selectedCafe && (
        <RouletteResult
          cafe={selectedCafe}
          filters={filters}
          onSpinAgain={handleSpinAgain}
          onAdjustFilters={handleAdjustFilters}
        />
      )}
    </div>
  );
}
