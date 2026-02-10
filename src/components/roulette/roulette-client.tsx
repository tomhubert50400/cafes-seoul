'use client';

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Search, X, MapPin, ChevronDown, ChevronUp } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useI18n } from '@/lib/i18n';
import { useMapFilters } from '@/hooks/use-map-filters';
import { filterCafes } from '@/lib/utils/filter-cafes';
import { SEOUL_DISTRICTS, POPULAR_NEIGHBORHOODS, getDistanceMeters, NEIGHBORHOOD_RADIUS_M } from '@/lib/constants/districts';
import { getLocalizedText } from '@/types/cafe';
import { RouletteIdle } from './roulette-idle';
import { RouletteSpinner } from './roulette-spinner';
import { RouletteResult } from './roulette-result';
import { RouletteFilterSheet } from './roulette-filter-sheet';
import type { CafeSummary } from '@/types/cafe';
import type { UserVibe } from '@/types/vibes';

type Phase = 'idle' | 'spinning' | 'result';

interface RouletteClientProps {
  cafes: CafeSummary[];
  favoriteIds?: string[];
  isLoggedIn?: boolean;
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

export function RouletteClient({ cafes, favoriteIds, isLoggedIn }: RouletteClientProps) {
  const { t, language } = useI18n();
  const [userVibes, setUserVibes] = useState<UserVibe[]>([]);
  const {
    filters,
    updateFilter,
    clearFilters,
    applyPreset,
    matchedPreset,
    activeFilterCount,
    allPresets,
  } = useMapFilters(userVibes);

  useEffect(() => {
    import('@/lib/actions/vibes').then(({ getVibesAction }) => {
      getVibesAction().then((result) => {
        if (result.success && result.vibes) {
          setUserVibes(result.vibes);
        }
      });
    });
  }, []);

  const [phase, setPhase] = useState<Phase>('idle');
  const [selectedCafe, setSelectedCafe] = useState<CafeSummary | null>(null);
  const recentIdsRef = useRef<Set<string>>(new Set());
  const [selectedDistrictIds, setSelectedDistrictIds] = useState<number[]>([]);
  const [selectedNeighborhoodSlugs, setSelectedNeighborhoodSlugs] = useState<string[]>([]);
  const [districtSearch, setDistrictSearch] = useState('');
  const [showAllAreas, setShowAllAreas] = useState(false);

  const filteredCafes = useMemo(() => {
    let result = filterCafes(cafes, filters);

    // Apply favorites filter
    if (filters?.showFavoritesOnly && favoriteIds?.length) {
      result = result.filter((cafe) => favoriteIds.includes(cafe.id));
    }

    const hasDistricts = selectedDistrictIds.length > 0;
    const hasNeighborhoods = selectedNeighborhoodSlugs.length > 0;

    if (hasDistricts || hasNeighborhoods) {
      const selectedNeighborhoods = POPULAR_NEIGHBORHOODS.filter((n) =>
        selectedNeighborhoodSlugs.includes(n.slug)
      );

      result = result.filter((c) => {
        // Match if cafe is in any selected district
        if (hasDistricts && selectedDistrictIds.includes(c.districtId)) return true;
        // Match if cafe is within radius of any selected neighborhood center
        if (hasNeighborhoods) {
          return selectedNeighborhoods.some(
            (n) => getDistanceMeters(c.latitude, c.longitude, n.lat, n.lng) <= NEIGHBORHOOD_RADIUS_M
          );
        }
        return false;
      });
    }

    return result;
  }, [cafes, filters, favoriteIds, selectedDistrictIds, selectedNeighborhoodSlugs]);

  const matchingDistricts = useMemo(() => {
    if (!districtSearch.trim()) return SEOUL_DISTRICTS;
    const q = districtSearch.toLowerCase();
    return SEOUL_DISTRICTS.filter((d) =>
      Object.values(d.name).some((v) => v.toLowerCase().includes(q)) ||
      d.slug.includes(q)
    );
  }, [districtSearch]);

  // Also search through popular neighborhoods and return matching ones
  const matchingNeighborhoods = useMemo(() => {
    if (!districtSearch.trim()) return [];
    const q = districtSearch.toLowerCase();
    return POPULAR_NEIGHBORHOODS.filter((n) =>
      Object.values(n.name).some((v) => v.toLowerCase().includes(q)) ||
      n.slug.includes(q)
    );
  }, [districtSearch]);

  const selectedDistricts = useMemo(
    () => SEOUL_DISTRICTS.filter((d) => selectedDistrictIds.includes(d.id)),
    [selectedDistrictIds]
  );

  const selectedNeighborhoods = useMemo(
    () => POPULAR_NEIGHBORHOODS.filter((n) => selectedNeighborhoodSlugs.includes(n.slug)),
    [selectedNeighborhoodSlugs]
  );

  const hasAnyLocationFilter = selectedDistricts.length > 0 || selectedNeighborhoods.length > 0;

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
          applyPreset={applyPreset}
          matchedPresetId={matchedPreset?.id ?? null}
          presets={allPresets}
        />
      </div>

      {/* Location search */}
      <div className="space-y-2">
        {/* Selected location badges (districts + neighborhoods) */}
        {hasAnyLocationFilter && (
          <div className="flex flex-wrap items-center gap-1.5">
            {selectedNeighborhoods.map((n) => (
              <Badge key={`n-${n.slug}`} variant="secondary" className="gap-1 py-1 px-2.5 text-sm">
                <MapPin className="h-3 w-3" />
                {getLocalizedText(n.name, language)}
                <button
                  onClick={() => setSelectedNeighborhoodSlugs((prev) => prev.filter((s) => s !== n.slug))}
                  className="ml-0.5 hover:text-foreground transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            {selectedDistricts.map((d) => (
              <Badge key={`d-${d.id}`} variant="secondary" className="gap-1 py-1 px-2.5 text-sm">
                <MapPin className="h-3 w-3" />
                {getLocalizedText(d.name, language)}
                <button
                  onClick={() => setSelectedDistrictIds((prev) => prev.filter((id) => id !== d.id))}
                  className="ml-0.5 hover:text-foreground transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            <button
              onClick={() => {
                setSelectedDistrictIds([]);
                setSelectedNeighborhoodSlugs([]);
                setDistrictSearch('');
              }}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors ml-1"
            >
              {t('roulette.clearFilters')}
            </button>
          </div>
        )}

        {/* Search input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder={hasAnyLocationFilter ? t('roulette.districtSearch') : t('roulette.searchDistrictOrArea')}
            value={districtSearch}
            onChange={(e) => setDistrictSearch(e.target.value)}
            className="pl-9 h-10"
          />
        </div>

        {/* Search results: neighborhoods first, then districts */}
        {districtSearch.trim() && (matchingDistricts.length > 0 || matchingNeighborhoods.length > 0) && (
          <div className="flex flex-wrap gap-1.5">
            {/* Matching neighborhoods (proximity-based filtering) */}
            {matchingNeighborhoods
              .filter((n) => !selectedNeighborhoodSlugs.includes(n.slug))
              .map((n) => {
                const parentDistrict = SEOUL_DISTRICTS.find((d) => d.id === n.districtId);
                return (
                  <Badge
                    key={`n-${n.slug}`}
                    variant="outline"
                    className="cursor-pointer hover:bg-accent transition-colors py-1 px-2.5"
                    onClick={() => {
                      setSelectedNeighborhoodSlugs((prev) => [...prev, n.slug]);
                      setDistrictSearch('');
                    }}
                  >
                    {getLocalizedText(n.name, language)}
                    {parentDistrict && (
                      <span className="text-muted-foreground ml-1 text-xs">
                        ({getLocalizedText(parentDistrict.name, language)})
                      </span>
                    )}
                  </Badge>
                );
              })}
            {/* Matching districts (full district filtering) */}
            {matchingDistricts
              .filter((d) => !selectedDistrictIds.includes(d.id))
              .map((d) => (
                <Badge
                  key={d.id}
                  variant="outline"
                  className="cursor-pointer hover:bg-accent transition-colors py-1 px-2.5"
                  onClick={() => {
                    setSelectedDistrictIds((prev) => [...prev, d.id]);
                    setDistrictSearch('');
                  }}
                >
                  {getLocalizedText(d.name, language)}
                </Badge>
              ))}
          </div>
        )}

        {/* Popular areas - show when no search and no location filter */}
        {!districtSearch.trim() && !hasAnyLocationFilter && (
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground">{t('roulette.popularAreas')}</p>
            <div className="flex flex-wrap gap-1.5">
              {(showAllAreas ? POPULAR_NEIGHBORHOODS : POPULAR_NEIGHBORHOODS.slice(0, 6)).map((n) => (
                <Badge
                  key={n.slug}
                  variant="outline"
                  className="cursor-pointer hover:bg-accent transition-colors py-1 px-2.5 text-xs"
                  onClick={() => {
                    if (!selectedNeighborhoodSlugs.includes(n.slug)) {
                      setSelectedNeighborhoodSlugs((prev) => [...prev, n.slug]);
                    }
                  }}
                >
                  {getLocalizedText(n.name, language)}
                </Badge>
              ))}
              <button
                onClick={() => setShowAllAreas((prev) => !prev)}
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors py-1 px-2"
              >
                {showAllAreas ? (
                  <>
                    {t('roulette.showLess')}
                    <ChevronUp className="h-3 w-3" />
                  </>
                ) : (
                  <>
                    {t('roulette.showMore')}
                    <ChevronDown className="h-3 w-3" />
                  </>
                )}
              </button>
            </div>
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
