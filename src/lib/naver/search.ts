'use server';

/**
 * Naver Local Search API
 * - Place Search for cafe submission autocomplete
 * - Coordinate parsing (mapx/mapy → WGS84)
 */

// ============================================
// TYPES
// ============================================

interface NaverLocalItem {
  title: string;
  link: string;
  category: string;
  description: string;
  telephone: string;
  address: string;
  roadAddress: string;
  mapx: string;
  mapy: string;
}

interface NaverLocalResponse {
  lastBuildDate: string;
  total: number;
  start: number;
  display: number;
  items: NaverLocalItem[];
}

export interface NaverPlaceSearchResult {
  id: string;
  name: string;
  address: string;
  roadAddress: string;
  phone: string;
  latitude: number;
  longitude: number;
  category: string;
  naverUrl: string;
  romanizedName?: string;
  romanizedAddress?: string;
}

// ============================================
// HELPERS
// ============================================

/**
 * Strip HTML bold tags from Naver search results
 */
function stripBoldTags(text: string): string {
  return text.replace(/<\/?b>/g, '');
}

/**
 * Extract Naver Place ID from link URL
 * Common formats:
 *   https://map.naver.com/p/entry/place/1234567890
 *   https://map.naver.com/v5/search/place/1234567890
 *   https://m.place.naver.com/restaurant/1234567890
 *   https://naver.me/xxxx (short link, can't extract)
 * Falls back to generating deterministic ID from item data
 */
function extractNaverPlaceId(item: NaverLocalItem): string {
  const link = item.link;
  if (link) {
    // Try various Naver Place URL patterns
    const patterns = [
      /place\/(\d+)/,
      /restaurant\/(\d+)/,
      /cafe\/(\d+)/,
    ];
    for (const pattern of patterns) {
      const match = link.match(pattern);
      if (match) return match[1];
    }
  }

  // Fallback: generate deterministic ID from name + address + coordinates
  const raw = `${stripBoldTags(item.title)}|${item.address}|${item.mapx}|${item.mapy}`;
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    const chr = raw.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0;
  }
  return `naver_${Math.abs(hash)}`;
}

/**
 * Parse Naver mapx/mapy coordinates to WGS84.
 * Naver changed from KATECH to WGS84 coordinates (scaled by 10^7).
 * - If value > 360 → divide by 10^7 (scaled integer format)
 * - Otherwise → use as-is (already WGS84 decimal)
 */
function parseNaverCoordinate(value: string): number {
  const num = parseFloat(value);
  if (isNaN(num)) return 0;
  // If it looks like a scaled integer (e.g., 1270475020 for 127.0475020)
  if (Math.abs(num) > 360) {
    return num / 10_000_000;
  }
  return num;
}

/**
 * Detect if a query is written in Latin characters (English, French, etc.)
 */
function isLatinQuery(query: string): boolean {
  const latinChars = query.replace(/[\s\d\-.,!?'"()]/g, '');
  return latinChars.length > 0 && /^[a-zA-ZÀ-ÿ]+$/.test(latinChars);
}

/**
 * Translate Korean texts to English using Google Translate API.
 * Batches multiple texts in one request using newline separator.
 */
async function translateKorean(texts: string[]): Promise<string[]> {
  try {
    const joined = texts.join('\n');
    const url = new URL('https://translate.googleapis.com/translate_a/single');
    url.searchParams.set('client', 'gtx');
    url.searchParams.set('sl', 'ko');
    url.searchParams.set('tl', 'en');
    url.searchParams.set('dt', 't');
    url.searchParams.set('q', joined);

    const res = await fetch(url.toString());
    if (!res.ok) return texts;

    const data = await res.json();
    const translated = (data[0] as Array<[string, ...unknown[]]>)
      .map((segment) => segment[0])
      .join('');
    return translated.split('\n');
  } catch {
    return texts;
  }
}

// ============================================
// PLACE SEARCH
// ============================================

/**
 * Search for places using Naver Local Search API
 * @param query - Search query (cafe name or address)
 * @returns Array of matching places
 */
export async function searchNaverPlaces(query: string): Promise<NaverPlaceSearchResult[]> {
  const clientId = process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error('NAVER_CLIENT_ID or NAVER_CLIENT_SECRET not configured');
    return [];
  }

  if (!query || query.trim().length < 2) {
    return [];
  }

  try {
    // Append "카페" (cafe) to help filter results if query is Latin
    const searchQuery = isLatinQuery(query) ? `${query} 카페` : query;

    const url = new URL('https://openapi.naver.com/v1/search/local.json');
    url.searchParams.set('query', searchQuery);
    url.searchParams.set('display', '10');
    url.searchParams.set('sort', 'comment'); // Sort by review count for relevance

    const response = await fetch(url.toString(), {
      headers: {
        'X-Naver-Client-Id': clientId,
        'X-Naver-Client-Secret': clientSecret,
      },
    });

    if (!response.ok) {
      console.error('Naver search API error:', response.status);
      return [];
    }

    const data: NaverLocalResponse = await response.json();
    const items = data.items || [];

    // Filter to cafe-like categories
    const cafeCategories = ['카페', '커피', 'cafe', 'coffee', '디저트', '베이커리'];
    const filteredItems = items.filter((item) => {
      const cat = item.category.toLowerCase();
      return cafeCategories.some((c) => cat.includes(c));
    });

    // Use filtered if we got results, otherwise use all (Naver's category can be inconsistent)
    const resultItems = filteredItems.length > 0 ? filteredItems : items;

    const results: NaverPlaceSearchResult[] = resultItems.map((item) => ({
      id: extractNaverPlaceId(item),
      name: stripBoldTags(item.title),
      address: item.address,
      roadAddress: item.roadAddress,
      phone: item.telephone,
      latitude: parseNaverCoordinate(item.mapy),
      longitude: parseNaverCoordinate(item.mapx),
      category: item.category,
      naverUrl: `https://map.naver.com/v5/search/${encodeURIComponent(stripBoldTags(item.title) + ' ' + (item.roadAddress || item.address))}`,
    }));

    // Translate names/addresses for Latin queries
    if (isLatinQuery(query) && results.length > 0) {
      const textsToTranslate = results.flatMap((r) => [
        r.name,
        r.roadAddress || r.address,
      ]);
      const translated = await translateKorean(textsToTranslate);
      for (let i = 0; i < results.length; i++) {
        const name = translated[i * 2];
        const address = translated[i * 2 + 1];
        if (name) results[i].romanizedName = name;
        if (address) results[i].romanizedAddress = address;
      }
    }

    return results;
  } catch (error) {
    console.error('Naver search error:', error);
    return [];
  }
}

// ============================================
// OPERATING HOURS
// ============================================

interface GraphQLBusinessHours {
  day: string;
  businessHours: { start: string; end: string };
}

interface GraphQLPlaceDetail {
  data: {
    placeDetail: {
      newBusinessHours: {
        businessHours: GraphQLBusinessHours[];
      } | null;
    } | null;
  };
}

const DAY_MAP: Record<string, string> = {
  MON: 'mon', MONDAY: 'mon',
  TUE: 'tue', TUESDAY: 'tue',
  WED: 'wed', WEDNESDAY: 'wed',
  THU: 'thu', THURSDAY: 'thu',
  FRI: 'fri', FRIDAY: 'fri',
  SAT: 'sat', SATURDAY: 'sat',
  SUN: 'sun', SUNDAY: 'sun',
};

/**
 * Fetch operating hours from Naver Place GraphQL API.
 * Only works with real Naver Place IDs (numeric), not hash-generated ones.
 * Returns null on failure (rate-limited, blocked, invalid ID, etc.).
 */
export async function fetchNaverPlaceHours(
  naverPlaceId: string
): Promise<Record<string, { open: string; close: string }> | null> {
  // Only attempt with real numeric Naver Place IDs
  if (!naverPlaceId || naverPlaceId.startsWith('naver_') || !/^\d+$/.test(naverPlaceId)) {
    return null;
  }

  try {
    const res = await fetch('https://pcmap-api.place.naver.com/place/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': `https://pcmap.place.naver.com/restaurant/${naverPlaceId}/home`,
      },
      body: JSON.stringify({
        operationName: 'getPlaceDetail',
        variables: { input: { deviceType: 'pc', id: naverPlaceId, isNx: false } },
        query: `query getPlaceDetail($input: PlaceDetailInput!) {
          placeDetail(input: $input) {
            newBusinessHours {
              businessHours { day businessHours { start end } }
            }
          }
        }`,
      }),
    });

    if (!res.ok) return null;

    const data: GraphQLPlaceDetail = await res.json();
    const hours = data.data?.placeDetail?.newBusinessHours?.businessHours;
    if (!hours || hours.length === 0) return null;

    const result: Record<string, { open: string; close: string }> = {};
    for (const entry of hours) {
      const dayKey = DAY_MAP[entry.day?.toUpperCase()];
      if (dayKey && entry.businessHours) {
        result[dayKey] = {
          open: entry.businessHours.start,
          close: entry.businessHours.end,
        };
      }
    }

    return Object.keys(result).length > 0 ? result : null;
  } catch {
    return null;
  }
}
