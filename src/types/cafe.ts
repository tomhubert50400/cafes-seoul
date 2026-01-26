// Translated text stored as JSONB: { "en": "...", "ko": "...", "fr": "...", etc. }
export type TranslatedText = Record<string, string>;

export interface Cafe {
  id: string;
  name: TranslatedText;
  slug: string;
  description: TranslatedText | null;

  // Location
  address: TranslatedText;
  districtId: number;
  neighborhoodId: number | null;
  latitude: number;
  longitude: number;

  // Contact
  phone: string | null;
  website: string | null;
  instagramHandle: string | null;
  naverPlaceId: string | null;
  kakaoPlaceId: string | null;

  // Operating Hours
  operatingHours: OperatingHours;

  // Features
  hasWifi: boolean;
  hasPowerOutlets: boolean;
  hasParking: boolean;
  isPetFriendly: boolean;
  hasOutdoorSeating: boolean;
  hasReservations: boolean;
  isLaptopFriendly: boolean;
  hasMeetingRooms: boolean;

  // Seating
  seatingCapacity: number | null;
  seatingTypes: string[];

  // Pricing
  priceRange: 1 | 2 | 3 | 4;
  averageDrinkPrice: number | null;

  // Categories
  cafeType: CafeType;
  specialties: string[];

  // Ratings (aggregated)
  overallRating: number;
  totalRatings: number;
  ratings: RatingBreakdown;

  // Status
  status: CafeStatus;
  verifiedAt: string | null;

  // Metadata
  createdAt: string;
  updatedAt: string;
}

export interface CafeSummary {
  id: string;
  name: TranslatedText;
  slug: string;
  address: TranslatedText;
  districtId: number;
  latitude: number;
  longitude: number;
  overallRating: number;
  totalRatings: number;
  priceRange: 1 | 2 | 3 | 4;
  cafeType: CafeType;
  hasWifi: boolean;
  hasPowerOutlets: boolean;
  isPetFriendly: boolean;
  isLaptopFriendly: boolean;
  primaryImageUrl: string | null;
  distance?: number; // in meters, when searching by location
}

export interface RatingBreakdown {
  food: number | null;
  drinks: number | null;
  temperature: number | null;
  seating: number | null;
  ambiance: number | null;
  wifi: number | null;
  noise: number | null;
  outlets: number | null;
  value: number | null;
}

export interface OperatingHours {
  mon?: DayHours;
  tue?: DayHours;
  wed?: DayHours;
  thu?: DayHours;
  fri?: DayHours;
  sat?: DayHours;
  sun?: DayHours;
  holidays?: string;
}

export interface DayHours {
  open: string; // HH:mm format
  close: string;
  breakStart?: string;
  breakEnd?: string;
}

export type CafeType =
  | 'specialty_coffee'
  | 'dessert_cafe'
  | 'study_cafe'
  | 'brunch_cafe'
  | 'roastery'
  | 'traditional_korean'
  | 'bakery_cafe'
  | 'book_cafe'
  | 'art_cafe'
  | 'other';

export type CafeStatus = 'pending' | 'active' | 'closed' | 'flagged';

export interface CafeImage {
  id: string;
  cafeId: string;
  storagePath: string;
  thumbnailPath: string | null;
  altText: TranslatedText | null;
  isPrimary: boolean;
  createdAt: string;
}

export interface District {
  id: number;
  name: TranslatedText;
  slug: string;
}

export interface Neighborhood {
  id: number;
  districtId: number;
  name: TranslatedText;
  slug: string;
}

// Helper function to get translated text with fallback
export function getLocalizedText(
  text: TranslatedText | null | undefined,
  lang: string,
  fallbackLang: string = 'en'
): string {
  if (!text) return '';
  return text[lang] || text[fallbackLang] || text['ko'] || text['en'] || Object.values(text)[0] || '';
}

// Rating dimension labels for UI
export const RATING_DIMENSIONS = {
  food: { ko: '음식', en: 'Food' },
  drinks: { ko: '음료', en: 'Drinks' },
  temperature: { ko: '실내 온도', en: 'Temperature' },
  seating: { ko: '좌석', en: 'Seating' },
  ambiance: { ko: '분위기', en: 'Ambiance' },
  wifi: { ko: '와이파이', en: 'WiFi' },
  noise: { ko: '소음 수준', en: 'Noise Level' },
  outlets: { ko: '콘센트', en: 'Outlets' },
  value: { ko: '가성비', en: 'Value' },
} as const;

export type RatingDimension = keyof typeof RATING_DIMENSIONS;

// Cafe type labels for UI
export const CAFE_TYPE_LABELS: Record<CafeType, { ko: string; en: string }> = {
  specialty_coffee: { ko: '스페셜티 커피', en: 'Specialty Coffee' },
  dessert_cafe: { ko: '디저트 카페', en: 'Dessert Cafe' },
  study_cafe: { ko: '스터디 카페', en: 'Study Cafe' },
  brunch_cafe: { ko: '브런치 카페', en: 'Brunch Cafe' },
  roastery: { ko: '로스터리', en: 'Roastery' },
  traditional_korean: { ko: '한옥 카페', en: 'Traditional Korean' },
  bakery_cafe: { ko: '베이커리 카페', en: 'Bakery Cafe' },
  book_cafe: { ko: '북 카페', en: 'Book Cafe' },
  art_cafe: { ko: '아트 카페', en: 'Art Cafe' },
  other: { ko: '기타', en: 'Other' },
};

// Price range labels
export const PRICE_RANGE_LABELS: Record<1 | 2 | 3 | 4, { ko: string; en: string; symbol: string }> = {
  1: { ko: '저렴', en: 'Budget', symbol: '₩' },
  2: { ko: '보통', en: 'Moderate', symbol: '₩₩' },
  3: { ko: '약간 비쌈', en: 'Pricey', symbol: '₩₩₩' },
  4: { ko: '고급', en: 'Expensive', symbol: '₩₩₩₩' },
};
