/**
 * In-memory rate limiter using sliding window algorithm.
 * Suitable for single-instance deployments. For multi-instance,
 * replace with Redis-based implementation.
 */

interface RateLimitEntry {
  timestamps: number[];
}

const store = new Map<string, RateLimitEntry>();

// Clean up expired entries every 5 minutes
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanup(windowMs: number) {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;

  for (const [key, entry] of store) {
    entry.timestamps = entry.timestamps.filter((t) => now - t < windowMs);
    if (entry.timestamps.length === 0) {
      store.delete(key);
    }
  }
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  limit: number;
}

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number = 60_000
): RateLimitResult {
  const now = Date.now();
  cleanup(windowMs);

  let entry = store.get(key);
  if (!entry) {
    entry = { timestamps: [] };
    store.set(key, entry);
  }

  // Remove timestamps outside the window
  entry.timestamps = entry.timestamps.filter((t) => now - t < windowMs);

  if (entry.timestamps.length >= limit) {
    return {
      success: false,
      remaining: 0,
      limit,
    };
  }

  entry.timestamps.push(now);

  return {
    success: true,
    remaining: limit - entry.timestamps.length,
    limit,
  };
}

/** Rate limit tiers */
export const RATE_LIMITS = {
  /** Public read endpoints: 60 req/min */
  PUBLIC_READ: { limit: 60, windowMs: 60_000 },
  /** Authenticated write endpoints: 30 req/min */
  AUTH_WRITE: { limit: 30, windowMs: 60_000 },
  /** Sensitive endpoints (submissions, photo uploads): 10 req/min */
  SENSITIVE: { limit: 10, windowMs: 60_000 },
} as const;
