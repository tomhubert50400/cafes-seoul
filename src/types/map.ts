// Map filter definitions
export interface MapFilters {
  // Rating dimensions (0-5, 0 = any)
  seatingMin?: number | null;
  wifiMin?: number | null;
  foodMin?: number | null;
  drinksMin?: number | null;
  lightingMin?: number | null;
  outletsMin?: number | null;
  quietnessMin?: number | null;
  priceValueMin?: number | null;
  comfortMin?: number | null;

  // Boolean features
  hasWifi?: boolean;
  hasPowerOutlets?: boolean;
  isPetFriendly?: boolean;
  isLaptopFriendly?: boolean;
  hasParking?: boolean;

  // Other filters
  priceRange?: number[];
  cafeTypes?: string[];
  districts?: number[];

  // Favorites filter
  showFavoritesOnly?: boolean;
}

// Filter preset definition
export interface FilterPreset {
  id: string;
  labelKey: string; // i18n key like 'map.presets.workStudy' or direct display name for user vibes
  icon: string;     // lucide-react icon name as string (resolved in component)
  filters: Partial<MapFilters>;
  isUserVibe?: boolean;
  isDefaultOverride?: boolean;
  userVibeId?: string;
}

// Map viewport bounds
export interface ViewportBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

// Map position
export interface MapPosition {
  lat: number;
  lng: number;
}

// Map viewport state
export interface MapViewport {
  center: MapPosition;
  level: number; // zoom level 1-14
  bounds?: ViewportBounds;
}
