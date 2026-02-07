'use client';

import { useState, useMemo, useCallback, useRef } from 'react';
import { Search, X, MapPin } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useI18n } from '@/lib/i18n';
import { useMapFilters } from '@/hooks/use-map-filters';
import { filterCafes } from '@/lib/utils/filter-cafes';
import { SEOUL_DISTRICTS } from '@/lib/constants/districts';
import { getLocalizedText } from '@/types/cafe';
import { RouletteIdle } from './roulette-idle';
import { RouletteSpinner } from './roulette-spinner';
import { RouletteResult } from './roulette-result';
import { RouletteFilterSheet } from './roulette-filter-sheet';
import { PresetBadges } from '@/components/map/preset-badges';
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
  const { t, language } = useI18n();
  const {
    filters,
    updateFilter,
    clearFilters,
    applyPreset,
    matchedPreset,
    activeFilterCount,
  } = useMapFilters();

  const [phase, setPhase] = useState<Phase>('idle');
  const [selectedCafe, setSelectedCafe] = useState<CafeSummary | null>(null);
  const recentIdsRef = useRef<Set<string>>(new Set());
  const [selectedDistrictId, setSelectedDistrictId] = useState<number | null>(null);
  const [districtSearch, setDistrictSearch] = useState('');

  const filteredCafes = useMemo(() => {
    let result = filterCafes(cafes, { ...filters, showFavoritesOnly: false });
    if (selectedDistrictId !== null) {
      result = result.filter((c) => c.districtId === selectedDistrictId);
    }
    return result;
  }, [cafes, filters, selectedDistrictId]);

  const matchingDistricts = useMemo(() => {
    if (!districtSearch.trim()) return SEOUL_DISTRICTS;
    const q = districtSearch.toLowerCase();
    return SEOUL_DISTRICTS.filter((d) =>
      Object.values(d.name).some((v) => v.toLowerCase().includes(q)) ||
      d.slug.includes(q)
    );
  }, [districtSearch]);

  const selectedDistrict = useMemo(
    () => selectedDistrictId !== null ? SEOUL_DISTRICTS.find((d) => d.id === selectedDistrictId) : null,
    [selectedDistrictId]
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
    if (filteredCafes.length === 0) return;

    const winner = selectRandomCafe(filteredCafes, recentIdsRef.current);
    recentIdsRef.current.add(winner.id);

    if (recentIdsRef.current.size > Math.floor(filteredCafes.length / 2)) {
      recentIdsRef.current.clear();
      recentIdsRef.current.add(winner.id);
    }

    setSelectedCafe(winner);
    setPhase('spinning');
  }, [filteredCafes]);

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

      {/* Preset badges */}
      <PresetBadges
        onPresetSelect={applyPreset}
        matchedPresetId={matchedPreset?.id ?? null}
      />

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

      {/* District search */}
      <div className="space-y-2">
        {selectedDistrict ? (
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="gap-1.5 py-1.5 px-3 text-sm">
              <MapPin className="h-3.5 w-3.5" />
              {getLocalizedText(selectedDistrict.name, language)}
            </Badge>
            <button
              onClick={() => {
                setSelectedDistrictId(null);
                setDistrictSearch('');
              }}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder={t('roulette.districtSearch')}
              value={districtSearch}
              onChange={(e) => setDistrictSearch(e.target.value)}
              className="pl-9 h-10"
            />
          </div>
        )}
        {!selectedDistrict && districtSearch.trim() && matchingDistricts.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {matchingDistricts.map((d) => (
              <Badge
                key={d.id}
                variant="outline"
                className="cursor-pointer hover:bg-accent transition-colors py-1 px-2.5"
                onClick={() => {
                  setSelectedDistrictId(d.id);
                  setDistrictSearch('');
                }}
              >
                {getLocalizedText(d.name, language)}
              </Badge>
            ))}
          </div>
        )}
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
