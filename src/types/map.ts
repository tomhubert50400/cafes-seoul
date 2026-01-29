// Map filter definitions
export interface MapFilters {
  // Rating dimensions (0-5, 0 = any)
  seatingMin?: number | null;
  wifiMin?: number | null;
  foodMin?: number | null;
  drinksMin?: number | null;
  ambianceMin?: number | null;
  outletsMin?: number | null;
  noiseMin?: number | null;
  valueMin?: number | null;
  temperatureMin?: number | null;
  
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
}

// Map viewport bounds
export interface MapBounds {
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
  bounds?: MapBounds;
}
