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
// NAVER PLACE GRAPHQL (shared config)
// ============================================

const GRAPHQL_URL = 'https://pcmap-api.place.naver.com/place/graphql';
const GRAPHQL_HEADERS = {
  'Content-Type': 'application/json',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Origin': 'https://pcmap.place.naver.com',
};

// ============================================
// PLACE LOOKUP BY URL
// ============================================

/**
 * Extract Naver Place ID from various Naver Map URL formats.
 * Supports:
 *   https://map.naver.com/p/entry/place/1234567890
 *   https://map.naver.com/v5/entry/place/1234567890
 *   https://map.naver.com/p/search/.../place/1234567890
 *   https://m.place.naver.com/restaurant/1234567890
 *   https://m.place.naver.com/cafe/1234567890
 *   https://pcmap.place.naver.com/restaurant/1234567890/home
 */
function extractPlaceIdFromUrl(url: string): string | null {
  const patterns = [
    /place\/(\d+)/,
    /restaurant\/(\d+)/,
    /cafe\/(\d+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

/**
 * Fetch full place details from Naver Place GraphQL API by Place ID.
 */
async function fetchPlaceDetailsById(placeId: string): Promise<NaverPlaceSearchResult | null> {
  try {
    const res = await fetch(GRAPHQL_URL, {
      method: 'POST',
      headers: {
        ...GRAPHQL_HEADERS,
        'Referer': `https://pcmap.place.naver.com/restaurant/${placeId}/home`,
      },
      body: JSON.stringify({
        query: `query {
          placeDetail(input: {deviceType: "pc", id: ${JSON.stringify(placeId)}, isNx: false}) {
            name
            address
            roadAddress
            phone
            virtualPhone
            x
            y
            category
          }
        }`,
      }),
    });

    if (!res.ok) return null;

    const data = await res.json();
    const detail = data?.data?.placeDetail;
    if (!detail) return null;

    return {
      id: placeId,
      name: detail.name || '',
      address: detail.address || '',
      roadAddress: detail.roadAddress || '',
      phone: detail.phone || detail.virtualPhone || '',
      latitude: parseFloat(detail.y) || 0,
      longitude: parseFloat(detail.x) || 0,
      category: Array.isArray(detail.category) ? detail.category.join('>') : (detail.category || ''),
      naverUrl: `https://map.naver.com/v5/entry/place/${placeId}`,
    };
  } catch {
    return null;
  }
}

/**
 * Fetch cafe details from a Naver Map URL.
 * Accepts short links (naver.me) and full Naver Map URLs.
 * Resolves short links by following redirects, then extracts the Place ID
 * and fetches full details via the Naver Place GraphQL API.
 */
export async function fetchNaverPlaceByUrl(url: string): Promise<NaverPlaceSearchResult | null> {
  if (!url || url.trim().length === 0) return null;

  let targetUrl = url.trim();

  // Resolve naver.me short links by following redirects
  if (targetUrl.includes('naver.me')) {
    try {
      const response = await fetch(targetUrl, { redirect: 'follow' });
      targetUrl = response.url;
    } catch {
      return null;
    }
  }

  const placeId = extractPlaceIdFromUrl(targetUrl);
  if (!placeId) return null;

  return fetchPlaceDetailsById(placeId);
}

// ============================================
// OPERATING HOURS (via Naver Place GraphQL)
// ============================================

interface GraphQLBusinessHoursEntry {
  day: string;
  businessHours: { start: string; end: string } | null;
}

/**
 * Korean day character → our day key
 * Day field format from API: "토", "토(2/14)", "월(2/16)" etc.
 */
const KO_DAY_MAP: Record<string, string> = {
  '월': 'mon',
  '화': 'tue',
  '수': 'wed',
  '목': 'thu',
  '금': 'fri',
  '토': 'sat',
  '일': 'sun',
};

/**
 * Extract Korean day character from day field like "토(2/14)" → "토"
 */
function parseKoreanDay(day: string): string | null {
  const firstChar = day?.charAt(0);
  return KO_DAY_MAP[firstChar] || null;
}

/**
 * Search Naver Place GraphQL API to find a place by name.
 * Returns the Naver Place ID of the best match, or null.
 */
async function findNaverPlaceId(cafeName: string): Promise<string | null> {
  try {
    const res = await fetch(GRAPHQL_URL, {
      method: 'POST',
      headers: { ...GRAPHQL_HEADERS, 'Referer': 'https://pcmap.place.naver.com/restaurant/list' },
      body: JSON.stringify({
        query: `{ places(input: {query: ${JSON.stringify(cafeName)}}) { items { id name } } }`,
      }),
    });

    if (!res.ok) return null;

    const data = await res.json();
    const items = data?.data?.places?.items;
    if (!items || items.length === 0) return null;

    // Return the first result's ID (best match)
    return items[0].id || null;
  } catch {
    return null;
  }
}

/**
 * Fetch operating hours from Naver Place GraphQL API by Place ID.
 */
async function fetchHoursByPlaceId(
  placeId: string
): Promise<Record<string, { open: string; close: string }> | null> {
  try {
    const res = await fetch(GRAPHQL_URL, {
      method: 'POST',
      headers: { ...GRAPHQL_HEADERS, 'Referer': `https://pcmap.place.naver.com/restaurant/${placeId}/home` },
      body: JSON.stringify({
        query: `query { placeDetail(input: {deviceType: "pc", id: ${JSON.stringify(placeId)}, isNx: false}) { newBusinessHours { businessHours { day businessHours { start end } } } } }`,
      }),
    });

    if (!res.ok) return null;

    const data = await res.json();
    // newBusinessHours is an array; first element has main business hours
    const hoursArray = data?.data?.placeDetail?.newBusinessHours;
    if (!Array.isArray(hoursArray) || hoursArray.length === 0) return null;

    const entries: GraphQLBusinessHoursEntry[] = hoursArray[0].businessHours;
    if (!entries || entries.length === 0) return null;

    const result: Record<string, { open: string; close: string }> = {};
    for (const entry of entries) {
      const dayKey = parseKoreanDay(entry.day);
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

/**
 * Fetch a photo from Naver Place for a cafe.
 * Two-step process: search for the cafe → get first image from place detail.
 * Downloads the image and uploads it to Supabase storage.
 * Returns the storage path or null on failure (graceful degradation).
 */
export async function fetchNaverPlacePhoto(cafeName: string): Promise<string | null> {
  if (!cafeName || cafeName.trim().length < 2) return null;

  try {
    const placeId = await findNaverPlaceId(cafeName);
    if (!placeId) return null;

    // Query GraphQL for images
    const res = await fetch(GRAPHQL_URL, {
      method: 'POST',
      headers: { ...GRAPHQL_HEADERS, 'Referer': `https://pcmap.place.naver.com/restaurant/${placeId}/photo` },
      body: JSON.stringify({
        query: `query { placeDetail(input: {deviceType: "pc", id: ${JSON.stringify(placeId)}, isNx: false}) { images { images { origin } } } }`,
      }),
    });

    if (!res.ok) return null;

    const data = await res.json();
    const images = data?.data?.placeDetail?.images?.images;
    if (!Array.isArray(images) || images.length === 0) return null;

    const originUrl: string | undefined = images[0]?.origin;
    if (!originUrl) return null;

    // Download the image
    const imageRes = await fetch(originUrl);
    if (!imageRes.ok) return null;

    const imageBuffer = await imageRes.arrayBuffer();
    const contentType = imageRes.headers.get('content-type') || 'image/jpeg';

    // Upload to Supabase storage using service role (bypass RLS)
    const { createServiceRoleClient } = await import('@/lib/supabase/server');
    const supabase = createServiceRoleClient();

    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 10);
    const ext = contentType.includes('png') ? 'png' : contentType.includes('webp') ? 'webp' : 'jpg';
    const path = `naver-photos/${timestamp}-${random}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('cafe-images')
      .upload(path, imageBuffer, {
        contentType,
        cacheControl: '86400',
        upsert: false,
      });

    if (uploadError) {
      console.error('Naver photo upload error:', uploadError.message);
      return null;
    }

    return path;
  } catch (error) {
    console.error('Naver photo fetch error:', error);
    return null;
  }
}

/**
 * Fetch operating hours for a cafe by searching Naver Place.
 * Two-step process: search for the cafe → get hours from place detail.
 * Returns null on any failure (graceful degradation).
 */
export async function fetchNaverPlaceHours(
  cafeName: string
): Promise<Record<string, { open: string; close: string }> | null> {
  if (!cafeName || cafeName.trim().length < 2) return null;

  try {
    const placeId = await findNaverPlaceId(cafeName);
    if (!placeId) return null;

    return await fetchHoursByPlaceId(placeId);
  } catch {
    return null;
  }
}
