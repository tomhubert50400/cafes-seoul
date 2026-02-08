/**
 * Script to import cafe photos from Google Places API (New) into Supabase Storage
 *
 * Prerequisites:
 * 1. Enable "Places API (New)" in Google Cloud Console
 * 2. Set GOOGLE_TRANSLATE_API_KEY in .env.local
 * 3. Storage bucket will be created automatically
 *
 * Usage:
 * npx tsx scripts/import-photos-google.ts [--dry-run] [--limit=100]
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env.local") });

// ============================================
// CONFIGURATION
// ============================================

const GOOGLE_API_KEY = process.env.GOOGLE_TRANSLATE_API_KEY!;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const STORAGE_BUCKET = "cafe-images";
const PHOTO_MAX_WIDTH = 800;

// ============================================
// TYPES
// ============================================

interface Cafe {
  id: string;
  name: { ko: string; en?: string };
  address: { ko: string };
  latitude: number;
  longitude: number;
}

interface GooglePlace {
  id: string;
  displayName: { text: string };
  photos?: Array<{
    name: string;
    widthPx: number;
    heightPx: number;
  }>;
}

// ============================================
// GOOGLE PLACES API (NEW)
// ============================================

async function findGooglePlace(
  name: string,
  address: string,
  lat: number,
  lng: number
): Promise<GooglePlace | null> {
  try {
    const response = await fetch(
      "https://places.googleapis.com/v1/places:searchText",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": GOOGLE_API_KEY,
          "X-Goog-FieldMask": "places.id,places.displayName,places.photos",
        },
        body: JSON.stringify({
          textQuery: `${name} ${address}`,
          languageCode: "ko",
          locationBias: {
            circle: {
              center: { latitude: lat, longitude: lng },
              radius: 500.0,
            },
          },
          maxResultCount: 1,
        }),
      }
    );

    const data = await response.json();

    if (data.places?.length > 0) {
      return data.places[0];
    }

    // Fallback: search with just the name
    const fallbackResponse = await fetch(
      "https://places.googleapis.com/v1/places:searchText",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": GOOGLE_API_KEY,
          "X-Goog-FieldMask": "places.id,places.displayName,places.photos",
        },
        body: JSON.stringify({
          textQuery: `${name} 서울 카페`,
          languageCode: "ko",
          maxResultCount: 1,
        }),
      }
    );

    const fallbackData = await fallbackResponse.json();
    return fallbackData.places?.[0] || null;
  } catch (error) {
    console.error("Google Places API error:", error);
    return null;
  }
}

async function downloadPhoto(photoName: string): Promise<Buffer | null> {
  try {
    const url = `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=${PHOTO_MAX_WIDTH}&key=${GOOGLE_API_KEY}`;

    const response = await fetch(url, { redirect: "follow" });
    if (!response.ok) {
      console.error(`Photo fetch failed: ${response.status}`);
      return null;
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    console.error("Photo download error:", error);
    return null;
  }
}

// ============================================
// SUPABASE STORAGE
// ============================================

async function ensureStorageBucket(
  supabase: SupabaseClient
): Promise<boolean> {
  const { data: buckets } = await supabase.storage.listBuckets();

  if (!buckets?.find((b) => b.name === STORAGE_BUCKET)) {
    const { error } = await supabase.storage.createBucket(STORAGE_BUCKET, {
      public: true,
      fileSizeLimit: 5242880,
      allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
    });

    if (error) {
      console.error("Failed to create storage bucket:", error.message);
      return false;
    }
    console.log(`✅ Created storage bucket: ${STORAGE_BUCKET}`);
  }

  return true;
}

async function uploadPhoto(
  supabase: SupabaseClient,
  cafeId: string,
  photoBuffer: Buffer
): Promise<string | null> {
  const fileName = `${cafeId}/primary.jpg`;

  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(fileName, photoBuffer, {
      contentType: "image/jpeg",
      upsert: true,
    });

  if (error) {
    console.error(`Upload error:`, error.message);
    return null;
  }

  return fileName;
}

// ============================================
// MAIN
// ============================================

async function importPhotos(): Promise<void> {
  if (!GOOGLE_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error("❌ Missing environment variables");
    process.exit(1);
  }

  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const limitArg = args.find((a) => a.startsWith("--limit="));
  const limit = limitArg ? parseInt(limitArg.split("=")[1]) : Infinity;

  console.log("📸 Google Places Photo Import\n");
  console.log(`   Mode: ${dryRun ? "DRY RUN" : "LIVE"}`);
  console.log(`   Limit: ${limit === Infinity ? "None" : limit}\n`);

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  if (!dryRun) {
    const bucketReady = await ensureStorageBucket(supabase);
    if (!bucketReady) process.exit(1);
  }

  // Get cafes without photos
  const { data: existingPhotos } = await supabase
    .from("photos")
    .select("cafe_id");
  const cafesWithImages = new Set(existingPhotos?.map((p) => p.cafe_id) || []);

  const { data: allCafes, error } = await supabase
    .from("cafes")
    .select("id, name, address, latitude, longitude")
    .eq("status", "active");

  if (error || !allCafes) {
    console.error("❌ Failed to fetch cafes");
    process.exit(1);
  }

  const cafes = (allCafes as Cafe[])
    .filter((c) => !cafesWithImages.has(c.id))
    .slice(0, limit);

  console.log(`   Cafes with photos: ${cafesWithImages.size}`);
  console.log(`   Cafes to process: ${cafes.length}`);
  console.log(`   Estimated cost: ~$${(cafes.length * 0.024).toFixed(2)}\n`);

  if (cafes.length === 0) {
    console.log("✅ All cafes have photos!");
    return;
  }

  if (dryRun) {
    console.log("🔍 Testing first 5 cafes:\n");
    for (const cafe of cafes.slice(0, 5)) {
      process.stdout.write(`   ${cafe.name.ko.substring(0, 25).padEnd(25)}... `);
      const place = await findGooglePlace(
        cafe.name.ko,
        cafe.address.ko,
        cafe.latitude,
        cafe.longitude
      );
      if (place?.photos?.length) {
        console.log(`✅ ${place.photos.length} photos`);
      } else if (place) {
        console.log("⚠️ No photos");
      } else {
        console.log("❌ Not found");
      }
      await new Promise((r) => setTimeout(r, 200));
    }
    console.log("\n✅ Dry run complete.");
    return;
  }

  // Live import
  let success = 0, noPhoto = 0, failed = 0;

  for (let i = 0; i < cafes.length; i++) {
    const cafe = cafes[i];
    const progress = `[${i + 1}/${cafes.length}]`;
    process.stdout.write(`${progress} ${cafe.name.ko.substring(0, 20).padEnd(20)} `);

    const place = await findGooglePlace(
      cafe.name.ko,
      cafe.address.ko,
      cafe.latitude,
      cafe.longitude
    );

    if (!place) {
      console.log("❌ Not found");
      failed++;
      await new Promise((r) => setTimeout(r, 100));
      continue;
    }

    if (!place.photos?.length) {
      console.log("⚠️ No photos");
      noPhoto++;
      await new Promise((r) => setTimeout(r, 100));
      continue;
    }

    const photoBuffer = await downloadPhoto(place.photos[0].name);
    if (!photoBuffer) {
      console.log("❌ Download failed");
      failed++;
      continue;
    }

    const storagePath = await uploadPhoto(supabase, cafe.id, photoBuffer);
    if (!storagePath) {
      console.log("❌ Upload failed");
      failed++;
      continue;
    }

    const { error: dbError } = await supabase.from("photos").insert({
      cafe_id: cafe.id,
      user_id: null,
      storage_path: storagePath,
      status: "approved",
      upvote_count: 0,
    });

    if (dbError) {
      console.log(`❌ DB: ${dbError.message}`);
      failed++;
      continue;
    }

    console.log("✅");
    success++;
    await new Promise((r) => setTimeout(r, 150));
  }

  console.log("\n" + "=".repeat(40));
  console.log(`✅ Success: ${success}`);
  console.log(`⚠️ No photos: ${noPhoto}`);
  console.log(`❌ Failed: ${failed}`);
}

importPhotos().catch(console.error);
