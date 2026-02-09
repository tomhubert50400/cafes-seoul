/**
 * Script to scrape cafe photos from Bing Image Search and upload to Supabase Storage
 *
 * Uses Bing's /images/async endpoint (free, no API key needed) to find photos.
 * Parses HTML with cheerio to extract image URLs from the `m` attribute JSON.
 *
 * Usage:
 * npx tsx scripts/scrape-photos-bing.ts [--dry-run] [--limit=N]
 */

import { load } from "cheerio";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env.local") });

// ============================================
// CONFIGURATION
// ============================================

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const STORAGE_BUCKET = "cafe-images";
const DELAY_MS = 2000; // 2s between Bing requests to avoid rate limiting

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

// ============================================
// TYPES
// ============================================

interface Cafe {
  id: string;
  name: { ko: string; en?: string };
  address: { ko: string };
}

// ============================================
// BING IMAGE SEARCH
// ============================================

async function searchBingImages(query: string): Promise<string | null> {
  const url = `https://www.bing.com/images/async?q=${encodeURIComponent(query)}&mmasync=1`;

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "text/html",
        "Accept-Language": "ko-KR,ko;q=0.9",
      },
    });

    if (!response.ok) {
      console.error(`Bing fetch failed: ${response.status}`);
      return null;
    }

    const html = await response.text();
    const $ = load(html);

    // Image data is in the `m` attribute of <a> tags as JSON containing `murl`
    const firstResult = $("a[m]").first();
    if (!firstResult.length) return null;

    const mAttr = firstResult.attr("m");
    if (!mAttr) return null;

    const parsed = JSON.parse(mAttr);
    return parsed.murl || null;
  } catch (error) {
    console.error("Bing search error:", error);
    return null;
  }
}

// ============================================
// IMAGE DOWNLOAD
// ============================================

async function downloadImage(imageUrl: string): Promise<Buffer | null> {
  try {
    const response = await fetch(imageUrl, {
      headers: { "User-Agent": USER_AGENT },
      redirect: "follow",
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      return null;
    }

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.startsWith("image/")) {
      return null;
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Skip tiny images (likely icons/placeholders) and huge ones
    if (buffer.length < 5000 || buffer.length > 10_000_000) {
      return null;
    }

    return buffer;
  } catch {
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
    console.log(`Created storage bucket: ${STORAGE_BUCKET}`);
  }

  return true;
}

async function uploadPhoto(
  supabase: SupabaseClient,
  cafeId: string,
  photoBuffer: Buffer,
  mimeType: string
): Promise<string | null> {
  const ext = mimeType.includes("png") ? "png" : mimeType.includes("webp") ? "webp" : "jpg";
  const fileName = `${cafeId}/primary.${ext}`;

  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(fileName, photoBuffer, {
      contentType: mimeType,
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

async function scrapePhotos(): Promise<void> {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error("Missing environment variables (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)");
    process.exit(1);
  }

  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const limitArg = args.find((a) => a.startsWith("--limit="));
  const limit = limitArg ? parseInt(limitArg.split("=")[1]) : Infinity;

  console.log("Bing Image Scraper for Cafe Photos\n");
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
  const cafesWithPhotos = new Set(existingPhotos?.map((p) => p.cafe_id) || []);

  const { data: allCafes, error } = await supabase
    .from("cafes")
    .select("id, name, address")
    .eq("status", "active");

  if (error || !allCafes) {
    console.error("Failed to fetch cafes");
    process.exit(1);
  }

  const cafes = (allCafes as Cafe[])
    .filter((c) => !cafesWithPhotos.has(c.id))
    .slice(0, limit);

  console.log(`   Cafes with photos: ${cafesWithPhotos.size}`);
  console.log(`   Cafes to process: ${cafes.length}`);
  console.log(`   Est. time: ~${Math.ceil((cafes.length * DELAY_MS) / 60000)} min\n`);

  if (cafes.length === 0) {
    console.log("All cafes have photos!");
    return;
  }

  if (dryRun) {
    console.log("Testing first 5 cafes:\n");
    for (const cafe of cafes.slice(0, 5)) {
      const query = `${cafe.name.ko} ${cafe.address.ko} 카페`;
      process.stdout.write(`   ${cafe.name.ko.substring(0, 25).padEnd(25)} `);

      const imageUrl = await searchBingImages(query);
      if (imageUrl) {
        console.log(`-> ${imageUrl.substring(0, 60)}...`);
      } else {
        // Fallback query
        const fallbackQuery = `${cafe.name.ko} 카페 서울`;
        const fallbackUrl = await searchBingImages(fallbackQuery);
        if (fallbackUrl) {
          console.log(`(fallback) -> ${fallbackUrl.substring(0, 50)}...`);
        } else {
          console.log("NOT FOUND");
        }
      }
      await new Promise((r) => setTimeout(r, DELAY_MS));
    }
    console.log("\nDry run complete.");
    return;
  }

  // Live import
  let success = 0,
    noResult = 0,
    downloadFail = 0,
    uploadFail = 0;

  for (let i = 0; i < cafes.length; i++) {
    const cafe = cafes[i];
    const progress = `[${i + 1}/${cafes.length}]`;
    process.stdout.write(
      `${progress} ${cafe.name.ko.substring(0, 20).padEnd(20)} `
    );

    // Primary query: name + address + 카페
    let imageUrl = await searchBingImages(
      `${cafe.name.ko} ${cafe.address.ko} 카페`
    );

    // Fallback: name + 카페 서울
    if (!imageUrl) {
      imageUrl = await searchBingImages(`${cafe.name.ko} 카페 서울`);
    }

    if (!imageUrl) {
      console.log("-- no result");
      noResult++;
      await new Promise((r) => setTimeout(r, DELAY_MS));
      continue;
    }

    const photoBuffer = await downloadImage(imageUrl);
    if (!photoBuffer) {
      console.log("-- download failed");
      downloadFail++;
      await new Promise((r) => setTimeout(r, DELAY_MS));
      continue;
    }

    // Detect mime type from URL or default to jpeg
    const mimeType = imageUrl.includes(".png")
      ? "image/png"
      : imageUrl.includes(".webp")
        ? "image/webp"
        : "image/jpeg";

    const storagePath = await uploadPhoto(
      supabase,
      cafe.id,
      photoBuffer,
      mimeType
    );
    if (!storagePath) {
      console.log("-- upload failed");
      uploadFail++;
      await new Promise((r) => setTimeout(r, DELAY_MS));
      continue;
    }

    const { error: dbError } = await supabase.from("photos").insert({
      cafe_id: cafe.id,
      user_id: null,
      storage_path: storagePath,
      status: "approved",
      upvote_count: 0,
      file_size: photoBuffer.length,
      mime_type: mimeType,
    });

    if (dbError) {
      console.log(`-- db error: ${dbError.message}`);
      uploadFail++;
      await new Promise((r) => setTimeout(r, DELAY_MS));
      continue;
    }

    console.log(`OK (${(photoBuffer.length / 1024).toFixed(0)}kb)`);
    success++;
    await new Promise((r) => setTimeout(r, DELAY_MS));
  }

  console.log("\n" + "=".repeat(40));
  console.log(`Success:         ${success}`);
  console.log(`No result:       ${noResult}`);
  console.log(`Download failed: ${downloadFail}`);
  console.log(`Upload failed:   ${uploadFail}`);
  console.log(`Total processed: ${cafes.length}`);
}

scrapePhotos().catch(console.error);
