'use client';

import { useState, useCallback, useTransition, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, X, Loader2, ArrowUp } from 'lucide-react';
import { CafesTable } from './cafes-table';
import { searchCafes } from '@/lib/actions/admin';
import type { AdminCafe } from '@/lib/actions/admin';

interface AdminCafesManagerProps {
  initialCafes: AdminCafe[];
  totalCount: number;
  translations: Record<string, string>;
}

export function AdminCafesManager({ initialCafes, totalCount, translations }: AdminCafesManagerProps) {
  const [query, setQuery] = useState('');
  const [cafes, setCafes] = useState<AdminCafe[]>(initialCafes);
  const [displayedTotal, setDisplayedTotal] = useState(totalCount);
  const [isPending, startTransition] = useTransition();
  const [isSearching, setIsSearching] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const searchIdRef = useRef(0);

  // Show back to top button when scrolled down
  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Debounced search
  const handleSearch = useCallback((searchQuery: string) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (!searchQuery.trim()) {
      // Reset to initial cafes when search is cleared
      setCafes(initialCafes);
      setDisplayedTotal(totalCount);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);

    debounceRef.current = setTimeout(() => {
      startTransition(async () => {
        const result = await searchCafes(searchQuery);
        if (result.success && result.cafes) {
          setCafes(result.cafes);
          setDisplayedTotal(result.total ?? result.cafes.length);
        }
        setIsSearching(false);
      });
    }, 300); // 300ms debounce
  }, [initialCafes, totalCount]);

  // Trigger search when query changes
  useEffect(() => {
    handleSearch(query);
  }, [query, handleSearch]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const clearSearch = () => {
    setQuery('');
  };

  return (
    <div className="space-y-4 min-w-0">
      {/* Search Input */}
      <div className="relative w-full max-w-md">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={translations['admin.cafes.search'] || 'Search by name or address...'}
          className="pl-9 pr-9"
        />
        {(isPending || isSearching) && (
          <Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
        {query && !isPending && !isSearching && (
          <button
            type="button"
            onClick={clearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      {/* Results */}
      {cafes.length > 0 ? (
        <>
          <div className="rounded-md border overflow-hidden">
            <CafesTable cafes={cafes} translations={translations} />
          </div>
          <div className="text-sm text-muted-foreground">
            {query.trim()
              ? `${displayedTotal} ${displayedTotal === 1 ? 'result' : 'results'} for "${query}"`
              : `${totalCount} ${totalCount === 1 ? 'cafe' : 'cafes'} total`}
          </div>
        </>
      ) : (
        <div className="rounded-md border p-8 text-center text-muted-foreground">
          {query.trim()
            ? translations['admin.cafes.noResults'] || 'No cafes match your search'
            : translations['admin.cafes.empty'] || 'No cafes found'}
        </div>
      )}

      {/* Back to Top Button */}
      {showBackToTop && (
        <Button
          onClick={scrollToTop}
          size="icon"
          className="fixed bottom-6 right-6 z-50 rounded-full shadow-lg"
          aria-label="Back to top"
        >
          <ArrowUp className="size-5" />
        </Button>
      )}
    </div>
  );
}
