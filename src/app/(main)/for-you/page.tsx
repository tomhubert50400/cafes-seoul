import type { Metadata } from 'next';
import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { ForYouClient } from '@/components/for-you/for-you-client';
import { getForYouCafes, getPopularCafesWithPhotos, getUserTopDimensions } from '@/lib/supabase/recommendations';
import { getUserFavoriteIds } from '@/lib/supabase/favorites';

export const metadata: Metadata = {
  title: 'For You - Seoul Cafe Guide',
  description: 'Discover personalized cafe recommendations just for you. Scroll to explore Seoul\'s best cafes.',
};

// Fisher-Yates shuffle – randomise display order each visit
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function ForYouSkeleton() {
  return (
    <div className="relative h-[calc(100vh-var(--safe-header-height))] w-full overflow-hidden">
      {/* Simulates the full-screen card layout */}
      <div className="absolute inset-0 animate-pulse bg-zinc-900" />
      <div className="absolute bottom-0 left-0 right-0 p-6 space-y-3">
        <div className="h-7 w-2/3 rounded bg-zinc-700" />
        <div className="h-5 w-1/3 rounded bg-zinc-800" />
        <div className="flex gap-2 mt-4">
          <div className="h-8 w-20 rounded-full bg-zinc-800" />
          <div className="h-8 w-16 rounded-full bg-zinc-800" />
        </div>
      </div>
    </div>
  );
}

// Async component — data fetching happens here, streamed via Suspense
async function ForYouContent() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;

  let cafes;
  let favoriteIds: string[] = [];

  const topDimensions = await getUserTopDimensions(supabase, user?.id ?? null);

  if (user) {
    [cafes, favoriteIds] = await Promise.all([
      getForYouCafes(supabase, user.id, 30),
      getUserFavoriteIds(supabase, user.id),
    ]);

    // If recommendations are empty (new user with no ratings), fall back to popular
    if (cafes.length === 0) {
      cafes = await getPopularCafesWithPhotos(supabase, 30);
    }

    // Filter out already-favorited cafes
    const favSet = new Set(favoriteIds);
    cafes = cafes.filter((c) => !favSet.has(c.id));
  } else {
    cafes = await getPopularCafesWithPhotos(supabase, 30);
  }

  // Shuffle so the user sees a different order each visit
  cafes = shuffle(cafes);

  return (
    <ForYouClient
      cafes={cafes}
      favoriteIds={favoriteIds}
      isAuthenticated={!!user}
      topDimensions={topDimensions}
    />
  );
}

// Non-async page — shell renders immediately, Suspense streams data
export default function ForYouPage() {
  return (
    <div className="flex flex-col bg-black">
      <main id="main-content" className="flex-1">
        <Suspense fallback={<ForYouSkeleton />}>
          <ForYouContent />
        </Suspense>
      </main>
    </div>
  );
}
