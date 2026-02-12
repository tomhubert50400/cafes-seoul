'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { Search, X, TrainFront } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useI18n } from '@/lib/i18n';
import { getLocalizedText } from '@/types/cafe';
import type { MetroStation } from '@/types/metro';

interface StationSelectorProps {
  selectedStation: MetroStation | null;
  onSelect: (station: MetroStation | null) => void;
  stations: MetroStation[];
}

export function StationSelector({ selectedStation, onSelect, stations }: StationSelectorProps) {
  const { t, language } = useI18n();
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Filter stations by search query
  const filteredStations = useMemo(() => {
    if (!search.trim()) return stations.slice(0, 30);
    const q = search.toLowerCase();
    return stations.filter((s) =>
      Object.values(s.name).some((v) => v.toLowerCase().includes(q)) ||
      s.line?.lineNumber.toLowerCase().includes(q)
    ).slice(0, 30);
  }, [stations, search]);

  // Group by unique station name (merge multi-line stations)
  const groupedStations = useMemo(() => {
    const map = new Map<string, MetroStation[]>();
    for (const station of filteredStations) {
      const key = `${station.name.ko}_${station.latitude.toFixed(3)}_${station.longitude.toFixed(3)}`;
      const existing = map.get(key);
      if (existing) {
        existing.push(station);
      } else {
        map.set(key, [station]);
      }
    }
    return Array.from(map.values());
  }, [filteredStations]);

  if (selectedStation) {
    return (
      <Badge variant="secondary" className="gap-1.5 py-1.5 px-3 text-sm h-9 w-full justify-between">
        <span className="flex items-center gap-1.5">
          <TrainFront className="h-3.5 w-3.5" />
          {selectedStation.line && (
            <span
              className="inline-flex items-center justify-center h-4 min-w-4 px-1 rounded text-[10px] font-bold text-white leading-none"
              style={{ backgroundColor: selectedStation.line.color }}
            >
              {selectedStation.line.lineNumber}
            </span>
          )}
          {getLocalizedText(selectedStation.name, language)}
        </span>
        <button
          onClick={() => onSelect(null)}
          className="ml-1 hover:text-foreground transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </Badge>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder={t('metro.selectStation')}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          className="pl-9 h-9"
        />
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover p-1 shadow-md max-h-[280px] overflow-y-auto">
          {groupedStations.length > 0 ? (
            groupedStations.map((stationGroup) => {
              const primary = stationGroup[0];
              return (
                <button
                  key={primary.id}
                  className="flex items-center gap-2 w-full rounded-sm px-2 py-1.5 text-sm hover:bg-accent transition-colors text-left"
                  onClick={() => {
                    onSelect(primary);
                    setSearch('');
                    setIsOpen(false);
                  }}
                >
                  <TrainFront className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <span className="flex-1 truncate">
                    {getLocalizedText(primary.name, language)}
                  </span>
                  <span className="flex items-center gap-1 shrink-0">
                    {stationGroup.map((s) => (
                      s.line && (
                        <span
                          key={s.id}
                          className="inline-flex items-center justify-center h-4 min-w-4 px-1 rounded text-[10px] font-bold text-white leading-none"
                          style={{ backgroundColor: s.line.color }}
                        >
                          {s.line.lineNumber}
                        </span>
                      )
                    ))}
                  </span>
                </button>
              );
            })
          ) : (
            <p className="text-sm text-muted-foreground px-2 py-1.5">
              {stations.length === 0
                ? t('metro.typeToSearch')
                : search.trim()
                  ? t('metro.noResults')
                  : t('metro.typeToSearch')
              }
            </p>
          )}
        </div>
      )}
    </div>
  );
}
