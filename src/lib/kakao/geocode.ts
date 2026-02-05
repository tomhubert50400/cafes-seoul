'use server';

/**
 * Kakao Maps API utilities
 * - Place Search with autocomplete
 * - Geocoding (address to coordinates)
 */

// ============================================
// TYPES
// ============================================

export interface KakaoPlace {
  id: string;
  place_name: string;
  category_name: string;
  category_group_code: string;
  phone: string;
  address_name: string;
  road_address_name: string;
  x: string; // longitude
  y: string; // latitude
  place_url: string;
}

export interface KakaoPlaceSearchResult {
  id: string;
  name: string;
  address: string;
  roadAddress: string;
  phone: string;
  latitude: number;
  longitude: number;
  category: string;
  kakaoUrl: string;
}

// ============================================
// PLACE SEARCH (for cafe autocomplete)
// ============================================

/**
 * Search for cafes using Kakao Local API
 * @param query - Search query (cafe name)
 * @returns Array of matching places
 */
export async function searchKakaoPlaces(query: string): Promise<KakaoPlaceSearchResult[]> {
  const apiKey = process.env.KAKAO_REST_API_KEY;

  if (!apiKey) {
    console.error('KAKAO_REST_API_KEY not configured');
    return [];
  }

  if (!query || query.trim().length < 2) {
    return [];
  }

  try {
    // Search for cafes (CE7 = cafe category)
    const url = new URL('https://dapi.kakao.com/v2/local/search/keyword.json');
    url.searchParams.set('query', query);
    url.searchParams.set('category_group_code', 'CE7'); // Cafes only
    url.searchParams.set('size', '10');

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `KakaoAK ${apiKey}`,
      },
    });

    if (!response.ok) {
      console.error('Kakao search API error:', response.status);
      return [];
    }

    const data = await response.json();
    const places: KakaoPlace[] = data.documents || [];

    return places.map((place) => ({
      id: place.id,
      name: place.place_name,
      address: place.address_name,
      roadAddress: place.road_address_name,
      phone: place.phone,
      latitude: parseFloat(place.y),
      longitude: parseFloat(place.x),
      category: place.category_name,
      kakaoUrl: place.place_url,
    }));
  } catch (error) {
    console.error('Kakao search error:', error);
    return [];
  }
}

// ============================================
// GEOCODING
// ============================================

interface KakaoAddressResult {
  address_name: string;
  x: string; // longitude
  y: string; // latitude
  address_type: string;
}

interface KakaoAddressResponse {
  meta: {
    total_count: number;
  };
  documents: KakaoAddressResult[];
}

interface GeocodingResult {
  latitude: number;
  longitude: number;
  address?: string;
}

/**
 * Geocode an address using Kakao Maps API
 * @param address - The address to geocode (Korean address works best)
 * @returns Coordinates or null if not found
 */
export async function geocodeAddress(address: string): Promise<GeocodingResult | null> {
  const apiKey = process.env.KAKAO_REST_API_KEY;

  if (!apiKey) {
    console.error('KAKAO_REST_API_KEY not configured');
    return null;
  }

  if (!address || !address.trim()) {
    return null;
  }

  try {
    const url = new URL('https://dapi.kakao.com/v2/local/search/address.json');
    url.searchParams.set('query', address);

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `KakaoAK ${apiKey}`,
      },
    });

    if (!response.ok) {
      console.error('Kakao geocoding API error:', response.status);
      return null;
    }

    const data: KakaoAddressResponse = await response.json();

    if (data.documents.length === 0) {
      // Try keyword search as fallback (works for place names)
      return geocodeByKeyword(address, apiKey);
    }

    const result = data.documents[0];
    return {
      latitude: parseFloat(result.y),
      longitude: parseFloat(result.x),
      address: result.address_name,
    };
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}

/**
 * Fallback: Search by keyword (for place names or partial addresses)
 */
async function geocodeByKeyword(query: string, apiKey: string): Promise<GeocodingResult | null> {
  try {
    const url = new URL('https://dapi.kakao.com/v2/local/search/keyword.json');
    url.searchParams.set('query', query);
    url.searchParams.set('size', '1');

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `KakaoAK ${apiKey}`,
      },
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    if (data.documents.length === 0) {
      return null;
    }

    const result = data.documents[0];
    return {
      latitude: parseFloat(result.y),
      longitude: parseFloat(result.x),
      address: result.address_name || result.road_address_name,
    };
  } catch (error) {
    console.error('Keyword search error:', error);
    return null;
  }
}
