import type { Metadata } from 'next';
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

export default async function ForYouPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

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
    <div className="min-h-dvh flex flex-col bg-muted/30">
      <main id="main-content" className="flex-1">
        <ForYouClient
          cafes={cafes}
          favoriteIds={favoriteIds}
          isAuthenticated={!!user}
          topDimensions={topDimensions}
        />
      </main>
    </div>
  );
}
