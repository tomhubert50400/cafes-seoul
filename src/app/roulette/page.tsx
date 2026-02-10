import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { Header } from '@/components/header';

export const metadata: Metadata = {
  title: 'Cafe Roulette',
  description: 'Can\'t decide where to go? Let Seoul Cafe Roulette pick a random cafe for you!',
};
import { Footer } from '@/components/footer';
import { RouletteClient } from '@/components/roulette/roulette-client';
import { transformCafeSummary } from '@/lib/supabase/transforms';
import type { CafeSummary } from '@/types/cafe';

async function getCafes(): Promise<CafeSummary[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('cafes')
    .select(`
      id, name, slug, address, district_id,
      latitude, longitude,
      overall_rating, total_ratings,
      rating_food, rating_drinks, rating_temperature, rating_seating,
      rating_ambiance, rating_wifi, rating_noise, rating_outlets, rating_value,
      price_range, cafe_type,
      has_wifi, has_power_outlets, is_pet_friendly, is_laptop_friendly, has_parking,
      operating_hours,
      photos(storage_path, upvote_count, status)
    `)
    .eq('status', 'active');

  if (error) {
    console.error('Error fetching cafes:', error);
    return [];
  }

  return (data || []).map((row) => {
    const photos = row.photos as { storage_path: string; upvote_count: number; status: string }[] | null;
    const topPhoto = photos
      ?.filter((p) => p.status === 'approved')
      .sort((a, b) => b.upvote_count - a.upvote_count)[0];
    return transformCafeSummary({
      ...row,
      primary_image_url: topPhoto?.storage_path || null,
    });
  });
}

export default async function RoulettePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const cafes = await getCafes();

  return (
    <div className="min-h-screen flex flex-col">
      <Header user={user} />
      <main className="flex-1">
        <div className="max-w-2xl mx-auto px-4 py-4 md:py-8">
          <RouletteClient cafes={cafes} />
        </div>
      </main>
      <Footer />
    </div>
  );
}
