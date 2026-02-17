'use client';

import { useMemo, useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { CafeCard } from '@/components/cafe-card';
import { FavoritesEmpty } from './favorites-empty';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { FavoriteWithCafe } from '@/types/favorites';
import type { CafeSummary } from '@/types/cafe';

interface FavoritesListProps {
  favorites: FavoriteWithCafe[];
  userId: string;
}

type SortOption = 'date' | 'rating' | 'neighborhood';

/**
 * Favorites list component with sort dropdown
 * Renders CafeCards in a grid layout matching cafe browse page
 */
export function FavoritesList({ favorites, userId }: FavoritesListProps) {
  const { t } = useI18n();
  const [sortBy, setSortBy] = useState<SortOption>('date');

  // Sort favorites based on selected option
  const sortedFavorites = useMemo(() => {
    const sorted = [...favorites];
    switch (sortBy) {
      case 'date':
        // Already sorted by created_at DESC from query
        return sorted;
      case 'rating':
        return sorted.sort(
          (a, b) => (b.cafe.overallRating ?? 0) - (a.cafe.overallRating ?? 0)
        );
      case 'neighborhood':
        return sorted.sort((a, b) =>
          (a.cafe.districtId ?? '').localeCompare(b.cafe.districtId ?? '')
        );
      default:
        return sorted;
    }
  }, [favorites, sortBy]);

  // Show empty state if no favorites
  if (favorites.length === 0) {
    return <FavoritesEmpty />;
  }

  return (
    <div>
      {/* Sort dropdown */}
      <div className="flex items-center justify-end gap-2 mb-6">
        <span className="text-sm text-muted-foreground">
          {t('favorites.sortBy')}
        </span>
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
          <SelectTrigger className="w-[160px]" size="sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date">{t('favorites.sortDate')}</SelectItem>
            <SelectItem value="rating">{t('favorites.sortRating')}</SelectItem>
            <SelectItem value="neighborhood">
              {t('favorites.sortNeighborhood')}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Favorites grid - same layout as cafe browse */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedFavorites.map((favorite) => {
          // Transform FavoriteWithCafe.cafe to CafeSummary format
          const cafeSummary: CafeSummary = {
            id: favorite.cafe.id,
            name: favorite.cafe.name,
            slug: favorite.cafe.slug,
            address: favorite.cafe.address,
            districtId: parseInt(favorite.cafe.districtId, 10) || 0,
            latitude: 0, // Not needed for card display
            longitude: 0,
            overallRating: favorite.cafe.overallRating ?? 0,
            totalRatings: favorite.cafe.totalRatings,
            priceRange: 2, // Default, not available in FavoriteCafe
            cafeType: 'other', // Default, not available in FavoriteCafe
            hasWifi: false,
            hasPowerOutlets: false,
            isPetFriendly: false,
            isLaptopFriendly: false,
            hasParking: false,
            primaryImageUrl: favorite.cafe.primaryImageUrl,
            photoUrls: favorite.cafe.photoUrls,
            ratings: {
              drinks: null,
              service: null,
              priceValue: null,
              quietness: null,
              seating: null,
              comfort: null,
              food: null,
              lighting: null,
              aesthetic: null,
            },
          };

          return (
            <CafeCard
              key={favorite.id}
              cafe={cafeSummary}
              isFavorited={true}
              userId={userId}
            />
          );
        })}
      </div>
    </div>
  );
}
