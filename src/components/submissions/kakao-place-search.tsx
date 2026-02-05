'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, MapPin, Phone, Loader2, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { searchKakaoPlaces, type KakaoPlaceSearchResult } from '@/lib/kakao/geocode';
import { useDebouncedValue } from '@/lib/hooks/use-debounced-value';

export interface KakaoPlaceSearchProps {
  onSelect: (place: KakaoPlaceSearchResult) => void;
  placeholder?: string;
  className?: string;
}

export function KakaoPlaceSearch({
  onSelect,
  placeholder = 'Search for a cafe...',
  className,
}: KakaoPlaceSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<KakaoPlaceSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<KakaoPlaceSearchResult | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const debouncedQuery = useDebouncedValue(query, 300);

  // Search when query changes
  useEffect(() => {
    if (debouncedQuery.length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const search = async () => {
      setIsLoading(true);
      try {
        const places = await searchKakaoPlaces(debouncedQuery);
        setResults(places);
        setIsOpen(places.length > 0);
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    };

    search();
  }, [debouncedQuery]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = useCallback((place: KakaoPlaceSearchResult) => {
    setSelectedPlace(place);
    setQuery(place.name);
    setIsOpen(false);
    onSelect(place);
  }, [onSelect]);

  const handleClear = useCallback(() => {
    setSelectedPlace(null);
    setQuery('');
    setResults([]);
    setIsOpen(false);
    inputRef.current?.focus();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    if (selectedPlace && value !== selectedPlace.name) {
      setSelectedPlace(null);
    }
  };

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => results.length > 0 && !selectedPlace && setIsOpen(true)}
          placeholder={placeholder}
          className={cn(
            'pl-10 pr-10',
            selectedPlace && 'border-green-500 bg-green-50 dark:bg-green-950/20'
          )}
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
        {selectedPlace && !isLoading && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
            onClick={handleClear}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Selected place preview */}
      {selectedPlace && (
        <div className="mt-2 p-3 rounded-lg border bg-muted/50 text-sm">
          <div className="font-medium">{selectedPlace.name}</div>
          <div className="flex items-center gap-1 text-muted-foreground mt-1">
            <MapPin className="h-3 w-3" />
            <span>{selectedPlace.roadAddress || selectedPlace.address}</span>
          </div>
          {selectedPlace.phone && (
            <div className="flex items-center gap-1 text-muted-foreground mt-1">
              <Phone className="h-3 w-3" />
              <span>{selectedPlace.phone}</span>
            </div>
          )}
        </div>
      )}

      {/* Dropdown results */}
      {isOpen && results.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-lg">
          <ul className="max-h-60 overflow-auto py-1">
            {results.map((place) => (
              <li key={place.id}>
                <button
                  type="button"
                  className={cn(
                    'w-full px-3 py-2 text-left hover:bg-accent focus:bg-accent focus:outline-none',
                    'transition-colors'
                  )}
                  onClick={() => handleSelect(place)}
                >
                  <div className="font-medium text-sm">{place.name}</div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                    <MapPin className="h-3 w-3 shrink-0" />
                    <span className="truncate">{place.roadAddress || place.address}</span>
                  </div>
                  {place.phone && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                      <Phone className="h-3 w-3 shrink-0" />
                      <span>{place.phone}</span>
                    </div>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* No results message */}
      {isOpen && results.length === 0 && query.length >= 2 && !isLoading && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover p-3 shadow-lg">
          <p className="text-sm text-muted-foreground text-center">
            No cafes found. Try a different search term.
          </p>
        </div>
      )}
    </div>
  );
}
