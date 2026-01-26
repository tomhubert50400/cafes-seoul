/**
 * Script to import cafes from Kakao Local API into Supabase
 * with automatic translation via Google Cloud Translation API
 *
 * Supports: ko (source), en, fr, zh, vi
 *
 * Prerequisites:
 * 1. Run the SQL migrations in Supabase first
 * 2. Set up environment variables in .env.local:
 *    - KAKAO_REST_API_KEY
 *    - GOOGLE_TRANSLATE_API_KEY
 *    - NEXT_PUBLIC_SUPABASE_URL
 *    - SUPABASE_SERVICE_ROLE_KEY
 *
 * Usage:
 * npx tsx scripts/import-cafes-kakao.ts [--dry-run] [--limit=100] [--district=gangnam]
 */

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { resolve } from "path";

// Load .env.local from project root
config({ path: resolve(process.cwd(), ".env.local") });

// ============================================
// TYPES
// ============================================

interface KakaoPlace {
  id: string;
  place_name: string;
  category_name: string;
  category_group_code: string;
  category_group_name: string;
  phone: string;
  address_name: string;
  road_address_name: string;
  x: string; // longitude
  y: string; // latitude
  place_url: string;
}

interface KakaoResponse {
  meta: {
    total_count: number;
    pageable_count: number;
    is_end: boolean;
  };
  documents: KakaoPlace[];
}

interface TranslatedText {
  ko: string;
  en?: string;
  fr?: string;
  zh?: string;
  vi?: string;
}

interface CafeInsert {
  name: TranslatedText;
  slug: string;
  address: TranslatedText;
  description: TranslatedText;
  latitude: number;
  longitude: number;
  location: string;
  phone: string | null;
  kakao_place_id: string;
  cafe_type: string;
  status: string;
  price_range: number;
  has_wifi: boolean;
  has_power_outlets: boolean;
  district_id: number | null;
}

// ============================================
// CONFIGURATION
// ============================================

const KAKAO_API_KEY = process.env.KAKAO_REST_API_KEY;
const GOOGLE_API_KEY = process.env.GOOGLE_TRANSLATE_API_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const TARGET_LANGUAGES = ["en", "fr", "zh", "vi"] as const;

// Districts with coordinates and IDs matching the database
const SEOUL_DISTRICTS = [
  { id: 1, name: "강남구", lat: 37.5172, lng: 127.0473 },
  { id: 2, name: "강동구", lat: 37.5301, lng: 127.1238 },
  { id: 3, name: "강북구", lat: 37.6396, lng: 127.0257 },
  { id: 4, name: "강서구", lat: 37.5509, lng: 126.8495 },
  { id: 5, name: "관악구", lat: 37.4784, lng: 126.9516 },
  { id: 6, name: "광진구", lat: 37.5385, lng: 127.0823 },
  { id: 7, name: "구로구", lat: 37.4954, lng: 126.8874 },
  { id: 8, name: "금천구", lat: 37.4519, lng: 126.9018 },
  { id: 9, name: "노원구", lat: 37.6542, lng: 127.0568 },
  { id: 10, name: "도봉구", lat: 37.6688, lng: 127.0471 },
  { id: 11, name: "동대문구", lat: 37.5744, lng: 127.04 },
  { id: 12, name: "동작구", lat: 37.5124, lng: 126.9393 },
  { id: 13, name: "마포구", lat: 37.5663, lng: 126.9014 },
  { id: 14, name: "서대문구", lat: 37.5791, lng: 126.9368 },
  { id: 15, name: "서초구", lat: 37.4837, lng: 127.0324 },
  { id: 16, name: "성동구", lat: 37.5633, lng: 127.0371 },
  { id: 17, name: "성북구", lat: 37.5894, lng: 127.0167 },
  { id: 18, name: "송파구", lat: 37.5145, lng: 127.1066 },
  { id: 19, name: "양천구", lat: 37.527, lng: 126.8561 },
  { id: 20, name: "영등포구", lat: 37.5264, lng: 126.8963 },
  { id: 21, name: "용산구", lat: 37.5324, lng: 126.9906 },
  { id: 22, name: "은평구", lat: 37.6027, lng: 126.9291 },
  { id: 23, name: "종로구", lat: 37.5735, lng: 126.979 },
  { id: 24, name: "중구", lat: 37.5641, lng: 126.9979 },
  { id: 25, name: "중랑구", lat: 37.6066, lng: 127.0927 },
];

// Popular areas for more granular search
const POPULAR_AREAS = [
  { name: "홍대", lat: 37.5563, lng: 126.922, districtId: 13 },
  { name: "이태원", lat: 37.5345, lng: 126.9946, districtId: 21 },
  { name: "성수동", lat: 37.5447, lng: 127.0558, districtId: 16 },
  { name: "연남동", lat: 37.5662, lng: 126.925, districtId: 13 },
  { name: "망원동", lat: 37.5565, lng: 126.91, districtId: 13 },
  { name: "합정", lat: 37.5496, lng: 126.9139, districtId: 13 },
  { name: "신사동 가로수길", lat: 37.5209, lng: 127.023, districtId: 1 },
  { name: "압구정", lat: 37.527, lng: 127.0283, districtId: 1 },
  { name: "청담동", lat: 37.5242, lng: 127.053, districtId: 1 },
  { name: "삼청동", lat: 37.583, lng: 126.982, districtId: 23 },
  { name: "북촌", lat: 37.5826, lng: 126.985, districtId: 23 },
  { name: "익선동", lat: 37.574, lng: 126.988, districtId: 23 },
  { name: "을지로", lat: 37.566, lng: 126.991, districtId: 24 },
  { name: "연희동", lat: 37.568, lng: 126.934, districtId: 14 },
  { name: "한남동", lat: 37.534, lng: 127.0, districtId: 21 },
  { name: "잠실", lat: 37.5133, lng: 127.1001, districtId: 18 },
  { name: "건대입구", lat: 37.5404, lng: 127.0696, districtId: 6 },
  { name: "왕십리", lat: 37.5614, lng: 127.0378, districtId: 16 },
  { name: "혜화", lat: 37.582, lng: 127.001, districtId: 23 },
  { name: "신촌", lat: 37.555, lng: 126.9366, districtId: 14 },
];

// ============================================
// TRANSLATION SERVICE
// ============================================

class GoogleTranslator {
  private apiKey: string;
  private cache: Map<string, string> = new Map();
  private requestCount = 0;
  private characterCount = 0;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async translateBatch(
    texts: string[],
    targetLang: string
  ): Promise<string[]> {
    // Filter out empty texts and create index map
    const nonEmptyTexts: { index: number; text: string }[] = [];
    texts.forEach((text, index) => {
      if (text && text.trim()) {
        const cacheKey = `${text}:${targetLang}`;
        if (!this.cache.has(cacheKey)) {
          nonEmptyTexts.push({ index, text });
        }
      }
    });

    // Translate non-cached texts
    if (nonEmptyTexts.length > 0) {
      const textsToTranslate = nonEmptyTexts.map((t) => t.text);

      try {
        const url = `https://translation.googleapis.com/language/translate/v2?key=${this.apiKey}`;
        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            q: textsToTranslate,
            source: "ko",
            target: targetLang,
            format: "text",
          }),
        });

        if (!response.ok) {
          const error = await response.text();
          console.error(`Translation error: ${error}`);
          return texts; // Return original on error
        }

        const data = await response.json();
        const translations = data.data.translations;

        // Cache results
        translations.forEach((t: { translatedText: string }, i: number) => {
          const originalText = nonEmptyTexts[i].text;
          const cacheKey = `${originalText}:${targetLang}`;
          this.cache.set(cacheKey, t.translatedText);
          this.characterCount += originalText.length;
        });

        this.requestCount++;
      } catch (error) {
        console.error("Translation API error:", error);
        return texts;
      }
    }

    // Build result array from cache
    return texts.map((text) => {
      if (!text || !text.trim()) return text;
      const cacheKey = `${text}:${targetLang}`;
      return this.cache.get(cacheKey) || text;
    });
  }

  getStats() {
    return {
      requests: this.requestCount,
      characters: this.characterCount,
      cacheSize: this.cache.size,
    };
  }
}

// ============================================
// KAKAO API
// ============================================

async function fetchCafesFromKakao(
  lat: number,
  lng: number,
  radius: number = 2000
): Promise<KakaoPlace[]> {
  const allPlaces: KakaoPlace[] = [];
  let page = 1;
  const maxPages = 3;

  while (page <= maxPages) {
    const url = new URL("https://dapi.kakao.com/v2/local/search/category.json");
    url.searchParams.set("category_group_code", "CE7");
    url.searchParams.set("x", lng.toString());
    url.searchParams.set("y", lat.toString());
    url.searchParams.set("radius", radius.toString());
    url.searchParams.set("page", page.toString());
    url.searchParams.set("size", "15");
    url.searchParams.set("sort", "accuracy");

    try {
      const response = await fetch(url.toString(), {
        headers: { Authorization: `KakaoAK ${KAKAO_API_KEY}` },
      });

      if (!response.ok) {
        console.error(`Kakao API error: ${response.status}`);
        break;
      }

      const data: KakaoResponse = await response.json();
      allPlaces.push(...data.documents);

      if (data.meta.is_end) break;
      page++;
    } catch (error) {
      console.error("Kakao fetch error:", error);
      break;
    }
  }

  return allPlaces;
}

// ============================================
// HELPERS
// ============================================

function createSlug(name: string, id: string): string {
  // Romanize common Korean cafe terms
  const romanized = name
    .replace(/카페/g, "cafe")
    .replace(/커피/g, "coffee")
    .replace(/스페셜티/g, "specialty")
    .replace(/로스터리/g, "roastery")
    .replace(/베이커리/g, "bakery");

  const base = romanized
    .toLowerCase()
    .replace(/[^a-z0-9가-힣\s-]/g, "")
    .replace(/\s+/g, "-")
    .substring(0, 50);

  return `${base}-${id.substring(0, 8)}`;
}

function getCafeType(categoryName: string, placeName: string): string {
  const text = (categoryName + " " + placeName).toLowerCase();

  // Chain cafes (exclude from import or mark differently)
  if (/스타벅스|starbucks|투썸플레이스|이디야|ediya|커피빈|coffee bean|메가커피|컴포즈/.test(text)) {
    return "chain";
  }
  if (/로스터리|로스팅|roaster/.test(text)) return "roastery";
  if (/베이커리|빵집|bakery/.test(text)) return "bakery_cafe";
  if (/디저트|케이크|dessert/.test(text)) return "dessert_cafe";
  if (/스터디|study|독서실/.test(text)) return "study_cafe";
  if (/브런치|brunch/.test(text)) return "brunch_cafe";
  if (/북카페|book/.test(text)) return "book_cafe";
  if (/한옥/.test(text)) return "traditional_korean";
  if (/스페셜티|specialty/.test(text)) return "specialty_coffee";

  return "other";
}

function findDistrictId(lat: number, lng: number): number | null {
  // Simple distance-based district matching
  let closestDistrict = SEOUL_DISTRICTS[0];
  let minDistance = Infinity;

  for (const district of SEOUL_DISTRICTS) {
    const distance = Math.sqrt(
      Math.pow(lat - district.lat, 2) + Math.pow(lng - district.lng, 2)
    );
    if (distance < minDistance) {
      minDistance = distance;
      closestDistrict = district;
    }
  }

  return closestDistrict.id;
}

// ============================================
// MAIN IMPORT LOGIC
// ============================================

async function importCafes(): Promise<void> {
  // Validate environment
  if (!KAKAO_API_KEY || !GOOGLE_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error("❌ Missing environment variables:");
    if (!KAKAO_API_KEY) console.error("   - KAKAO_REST_API_KEY");
    if (!GOOGLE_API_KEY) console.error("   - GOOGLE_TRANSLATE_API_KEY");
    if (!SUPABASE_URL) console.error("   - NEXT_PUBLIC_SUPABASE_URL");
    if (!SUPABASE_SERVICE_KEY) console.error("   - SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }

  // Parse CLI arguments
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const limitArg = args.find((a) => a.startsWith("--limit="));
  const limit = limitArg ? parseInt(limitArg.split("=")[1]) : Infinity;
  const districtArg = args.find((a) => a.startsWith("--district="));
  const districtFilter = districtArg ? districtArg.split("=")[1] : null;
  const skipChains = !args.includes("--include-chains");

  console.log("🚀 Seoul Cafe Import Script\n");
  console.log(`   Mode: ${dryRun ? "DRY RUN (no database changes)" : "LIVE"}`);
  console.log(`   Limit: ${limit === Infinity ? "None" : limit}`);
  console.log(`   Skip chains: ${skipChains}`);
  if (districtFilter) console.log(`   District filter: ${districtFilter}`);
  console.log("");

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  const translator = new GoogleTranslator(GOOGLE_API_KEY);

  // Test database connection
  const { error: testError } = await supabase.from("cafes").select("id").limit(1);
  if (testError) {
    console.error("❌ Cannot connect to Supabase. Run migrations first.");
    console.error("   Error:", testError.message);
    process.exit(1);
  }
  console.log("✅ Connected to Supabase\n");

  // Collect cafes from Kakao
  const allCafes = new Map<string, { place: KakaoPlace; districtId: number | null }>();

  // Fetch from popular areas first
  console.log("📍 Fetching from popular areas...\n");
  for (const area of POPULAR_AREAS) {
    process.stdout.write(`   ${area.name}... `);
    const places = await fetchCafesFromKakao(area.lat, area.lng, 1000);
    let newCount = 0;
    for (const place of places) {
      if (!allCafes.has(place.id)) {
        allCafes.set(place.id, { place, districtId: area.districtId });
        newCount++;
      }
    }
    console.log(`${places.length} found, ${newCount} new`);
    await new Promise((r) => setTimeout(r, 150));
  }

  // Fetch from districts
  console.log("\n📍 Fetching from districts...\n");
  for (const district of SEOUL_DISTRICTS) {
    if (districtFilter && !district.name.includes(districtFilter)) continue;

    process.stdout.write(`   ${district.name}... `);
    const places = await fetchCafesFromKakao(district.lat, district.lng, 3000);
    let newCount = 0;
    for (const place of places) {
      if (!allCafes.has(place.id)) {
        allCafes.set(place.id, { place, districtId: district.id });
        newCount++;
      }
    }
    console.log(`${places.length} found, ${newCount} new`);
    await new Promise((r) => setTimeout(r, 150));
  }

  console.log(`\n📊 Total unique cafes found: ${allCafes.size}\n`);

  // Filter and prepare cafes
  let cafesToImport = Array.from(allCafes.values());

  // Filter out chains if requested
  if (skipChains) {
    const beforeCount = cafesToImport.length;
    cafesToImport = cafesToImport.filter(({ place }) => {
      const type = getCafeType(place.category_name, place.place_name);
      return type !== "chain";
    });
    console.log(`   Filtered out ${beforeCount - cafesToImport.length} chain cafes`);
  }

  // Apply limit
  if (cafesToImport.length > limit) {
    cafesToImport = cafesToImport.slice(0, limit);
    console.log(`   Limited to ${limit} cafes`);
  }

  console.log(`   Cafes to import: ${cafesToImport.length}\n`);

  if (cafesToImport.length === 0) {
    console.log("No cafes to import. Exiting.");
    return;
  }

  // Translate in batches
  console.log("🌐 Translating cafe names and addresses...\n");

  const BATCH_SIZE = 50;
  const processedCafes: CafeInsert[] = [];

  for (let i = 0; i < cafesToImport.length; i += BATCH_SIZE) {
    const batch = cafesToImport.slice(i, i + BATCH_SIZE);
    const names = batch.map((c) => c.place.place_name);
    const addresses = batch.map((c) => c.place.road_address_name || c.place.address_name);

    const translations: Record<string, { names: string[]; addresses: string[] }> = {};

    for (const lang of TARGET_LANGUAGES) {
      process.stdout.write(`   Batch ${Math.floor(i / BATCH_SIZE) + 1}: Translating to ${lang}... `);
      translations[lang] = {
        names: await translator.translateBatch(names, lang),
        addresses: await translator.translateBatch(addresses, lang),
      };
      console.log("done");
      await new Promise((r) => setTimeout(r, 100)); // Rate limit
    }

    // Build cafe objects
    for (let j = 0; j < batch.length; j++) {
      const { place, districtId } = batch[j];
      const lat = parseFloat(place.y);
      const lng = parseFloat(place.x);

      const cafe: CafeInsert = {
        name: {
          ko: place.place_name,
          en: translations.en.names[j],
          fr: translations.fr.names[j],
          zh: translations.zh.names[j],
          vi: translations.vi.names[j],
        },
        slug: createSlug(place.place_name, place.id),
        address: {
          ko: place.road_address_name || place.address_name,
          en: translations.en.addresses[j],
          fr: translations.fr.addresses[j],
          zh: translations.zh.addresses[j],
          vi: translations.vi.addresses[j],
        },
        description: {
          ko: "",
          en: "",
          fr: "",
          zh: "",
          vi: "",
        },
        latitude: lat,
        longitude: lng,
        location: `SRID=4326;POINT(${lng} ${lat})`,
        phone: place.phone || null,
        kakao_place_id: place.id,
        cafe_type: getCafeType(place.category_name, place.place_name),
        status: "active",
        price_range: 2,
        has_wifi: true,
        has_power_outlets: false,
        district_id: districtId || findDistrictId(lat, lng),
      };

      processedCafes.push(cafe);
    }
  }

  const stats = translator.getStats();
  console.log(`\n   Translation stats: ${stats.characters} characters, ${stats.requests} API calls\n`);

  // Insert into database
  if (dryRun) {
    console.log("🔍 DRY RUN - Sample of cafes to be imported:\n");
    for (const cafe of processedCafes.slice(0, 5)) {
      console.log(`   ${cafe.name.ko}`);
      console.log(`     EN: ${cafe.name.en}`);
      console.log(`     FR: ${cafe.name.fr}`);
      console.log(`     Address: ${cafe.address.ko}`);
      console.log(`     Type: ${cafe.cafe_type}`);
      console.log("");
    }
    console.log(`   ... and ${processedCafes.length - 5} more cafes`);
    console.log("\n✅ Dry run complete. No changes made to database.");
    return;
  }

  console.log("💾 Inserting into Supabase...\n");

  let totalInserted = 0;
  let totalSkipped = 0;

  for (let i = 0; i < processedCafes.length; i += BATCH_SIZE) {
    const batch = processedCafes.slice(i, i + BATCH_SIZE);

    const { data, error } = await supabase
      .from("cafes")
      .upsert(batch, {
        onConflict: "kakao_place_id",
        ignoreDuplicates: true,
      })
      .select("id");

    if (error) {
      console.error(`   Batch ${Math.floor(i / BATCH_SIZE) + 1} error:`, error.message);
      // Try one by one
      for (const cafe of batch) {
        const { error: singleError } = await supabase.from("cafes").insert(cafe);
        if (singleError) {
          totalSkipped++;
        } else {
          totalInserted++;
        }
      }
    } else {
      totalInserted += data?.length || 0;
      console.log(`   Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${data?.length || 0} inserted`);
    }
  }

  console.log(`\n✅ Import complete!`);
  console.log(`   Inserted: ${totalInserted}`);
  console.log(`   Skipped (duplicates): ${totalSkipped}`);
  console.log(`   Translation cost estimate: ~$${((stats.characters / 1000000) * 20).toFixed(2)} (after free tier)`);
}

// Run
importCafes().catch(console.error);
