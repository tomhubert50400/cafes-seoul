'use server';

/**
 * Naver Place Search
 * - Primary search via Naver Place GraphQL API (same backend as Naver Map)
 * - Fallback via Naver Local Search API (official, uses API keys)
 * - Place lookup by URL (extract place ID from Naver Map links)
 * - Operating hours & photos via Naver Place GraphQL API
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

interface GraphQLPlaceItem {
  id: string;
  name: string;
  x: string;
  y: string;
  address: string;
  roadAddress: string;
  phone: string;
  category: string;
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
function extractNaverPlaceIdFromItem(item: NaverLocalItem): string {
  const link = item.link;
  if (link) {
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
 * Parse Naver mapx/mapy coordinates to WGS84.
 * Naver changed from KATECH to WGS84 coordinates (scaled by 10^7).
 * - If value > 360 → divide by 10^7 (scaled integer format)
 * - Otherwise → use as-is (already WGS84 decimal)
 */
function parseNaverCoordinate(value: string): number {
  const num = parseFloat(value);
  if (isNaN(num)) return 0;
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
// NAVER PLACE GRAPHQL (shared config)
// ============================================

const GRAPHQL_URL = 'https://pcmap-api.place.naver.com/place/graphql';
const GRAPHQL_HEADERS = {
  'Content-Type': 'application/json',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Origin': 'https://pcmap.place.naver.com',
};

// ============================================
// PLACE SEARCH (GraphQL primary, Local Search fallback)
// ============================================

/**
 * Search via Naver Place GraphQL API (same backend as Naver Map).
 * Returns the most up-to-date results.
 */
async function searchNaverPlacesGraphQL(query: string): Promise<NaverPlaceSearchResult[]> {
  try {
    const res = await fetch(GRAPHQL_URL, {
      method: 'POST',
      headers: { ...GRAPHQL_HEADERS, 'Referer': 'https://pcmap.place.naver.com/restaurant/list' },
      body: JSON.stringify({
        query: `{ places(input: {query: ${JSON.stringify(query)}}) { items { id name x y address roadAddress phone category } } }`,
      }),
    });

    if (!res.ok) return [];

    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      // Got HTML (rate limited) instead of JSON
      return [];
    }

    const items: GraphQLPlaceItem[] = data?.data?.places?.items || [];
    if (items.length === 0) return [];

    // Filter to cafe-like categories
    const cafeCategories = ['카페', '커피', 'cafe', 'coffee', '디저트', '베이커리'];
    const filteredItems = items.filter((item) => {
      const cat = (item.category || '').toLowerCase();
      return cafeCategories.some((c) => cat.includes(c));
    });

    // Use filtered if we got results, otherwise use all
    const resultItems = filteredItems.length > 0 ? filteredItems : items;

    return resultItems.slice(0, 10).map((item) => ({
      id: item.id,
      name: item.name || '',
      address: item.address || '',
      roadAddress: item.roadAddress || '',
      phone: item.phone || '',
      latitude: parseFloat(item.y) || 0,
      longitude: parseFloat(item.x) || 0,
      category: item.category || '',
      naverUrl: `https://map.naver.com/v5/entry/place/${item.id}`,
    }));
  } catch {
    return [];
  }
}

/**
 * Search via Naver Local Search API (official, uses API keys).
 * Used as fallback when GraphQL is unavailable.
 */
async function searchNaverPlacesLocal(query: string): Promise<NaverPlaceSearchResult[]> {
  const clientId = process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;

  if (!clientId || !clientSecret) return [];

  try {
    const searchQuery = isLatinQuery(query) ? `${query} 카페` : query;

    const url = new URL('https://openapi.naver.com/v1/search/local.json');
    url.searchParams.set('query', searchQuery);
    url.searchParams.set('display', '10');
    url.searchParams.set('sort', 'comment');

    const response = await fetch(url.toString(), {
      headers: {
        'X-Naver-Client-Id': clientId,
        'X-Naver-Client-Secret': clientSecret,
      },
    });

    if (!response.ok) return [];

    const data: NaverLocalResponse = await response.json();
    const items = data.items || [];

    const cafeCategories = ['카페', '커피', 'cafe', 'coffee', '디저트', '베이커리'];
    const filteredItems = items.filter((item) => {
      const cat = item.category.toLowerCase();
      return cafeCategories.some((c) => cat.includes(c));
    });

    const resultItems = filteredItems.length > 0 ? filteredItems : items;

    return resultItems.map((item) => ({
      id: extractNaverPlaceIdFromItem(item),
      name: stripBoldTags(item.title),
      address: item.address,
      roadAddress: item.roadAddress,
      phone: item.telephone,
      latitude: parseNaverCoordinate(item.mapy),
      longitude: parseNaverCoordinate(item.mapx),
      category: item.category,
      naverUrl: `https://map.naver.com/v5/search/${encodeURIComponent(stripBoldTags(item.title) + ' ' + (item.roadAddress || item.address))}`,
    }));
  } catch {
    return [];
  }
}

/**
 * Search for places using Naver Map's data.
 * Tries the GraphQL API first (same backend as Naver Map, most up-to-date),
 * then falls back to the official Local Search API.
 */
export async function searchNaverPlaces(query: string): Promise<NaverPlaceSearchResult[]> {
  if (!query || query.trim().length < 2) return [];

  try {
    // Primary: GraphQL API (same data as Naver Map)
    const graphqlResults = await searchNaverPlacesGraphQL(query);

    if (graphqlResults.length > 0) {
      await translateResults(graphqlResults);
      return graphqlResults;
    }

    // Fallback: Local Search API
    const localResults = await searchNaverPlacesLocal(query);

    if (localResults.length > 0) {
      await translateResults(localResults);
    }

    return localResults;
  } catch (error) {
    console.error('Naver search error:', error);
    return [];
  }
}

// ============================================
// PLACE LOOKUP BY URL
// ============================================

/**
 * Resolve a Naver Map URL to place details.
 * Handles:
 * - naver.me short links (resolved via HTTP redirect or HTML parsing)
 * - Full Naver Map URLs (place ID extracted from URL path)
 *
 * Uses the GraphQL `places` search to get full data (with coordinates),
 * with `placeDetail.base` as a lookup source for the place name.
 */
export async function fetchNaverPlaceByUrl(url: string): Promise<NaverPlaceSearchResult | null> {
  if (!url || url.trim().length === 0) return null;

  let targetUrl = url.trim();

  // Resolve naver.me short links
  if (targetUrl.includes('naver.me')) {
    try {
      // Try HTTP redirect first
      const response = await fetch(targetUrl, { redirect: 'follow' });
      const resolvedUrl = response.url;

      // If redirect worked and we got a different URL, use it
      if (resolvedUrl !== targetUrl && extractPlaceIdFromUrl(resolvedUrl)) {
        targetUrl = resolvedUrl;
      } else {
        // Redirect didn't give us a place URL, try parsing the HTML
        const html = await response.text();
        // Look for Naver Map URLs in the HTML (meta tags, scripts, etc.)
        const urlMatch = html.match(/https?:\/\/[^\s"'<>]*(?:place|restaurant|cafe)\/(\d+)[^\s"'<>]*/);
        if (urlMatch) {
          targetUrl = urlMatch[0];
        } else {
          return null;
        }
      }
    } catch {
      return null;
    }
  }

  const placeId = extractPlaceIdFromUrl(targetUrl);
  if (!placeId) return null;

  // Step 1: Get basic info from placeDetail.base (name, address, phone)
  try {
    const detailRes = await fetch(GRAPHQL_URL, {
      method: 'POST',
      headers: {
        ...GRAPHQL_HEADERS,
        'Referer': `https://pcmap.place.naver.com/restaurant/${placeId}/home`,
      },
      body: JSON.stringify({
        query: `query { placeDetail(input: {deviceType: "pc", id: ${JSON.stringify(placeId)}, isNx: false}) { base { name address roadAddress phone virtualPhone category } } }`,
      }),
    });

    if (!detailRes.ok) return null;

    const detailText = await detailRes.text();
    let detailData;
    try {
      detailData = JSON.parse(detailText);
    } catch {
      return null;
    }

    const base = detailData?.data?.placeDetail?.base;
    if (!base?.name) return null;

    // Step 2: Search by name to get coordinates
    let latitude = 0;
    let longitude = 0;

    try {
      const searchRes = await fetch(GRAPHQL_URL, {
        method: 'POST',
        headers: { ...GRAPHQL_HEADERS, 'Referer': 'https://pcmap.place.naver.com/restaurant/list' },
        body: JSON.stringify({
          query: `{ places(input: {query: ${JSON.stringify(base.name)}}) { items { id x y } } }`,
        }),
      });

      if (searchRes.ok) {
        const searchText = await searchRes.text();
        try {
          const searchData = JSON.parse(searchText);
          const items = searchData?.data?.places?.items || [];
          // Find the matching place by ID
          const match = items.find((item: { id: string }) => item.id === placeId);
          if (match) {
            latitude = parseFloat(match.y) || 0;
            longitude = parseFloat(match.x) || 0;
          } else if (items.length > 0) {
            // Use first result as approximate location
            latitude = parseFloat(items[0].y) || 0;
            longitude = parseFloat(items[0].x) || 0;
          }
        } catch { /* ignore parse errors */ }
      }
    } catch { /* coordinates are optional, continue without them */ }

    return {
      id: placeId,
      name: base.name,
      address: base.address || '',
      roadAddress: base.roadAddress || '',
      phone: base.phone || base.virtualPhone || '',
      latitude,
      longitude,
      category: base.category || '',
      naverUrl: `https://map.naver.com/v5/entry/place/${placeId}`,
    };
  } catch {
    return null;
  }
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
