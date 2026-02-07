import { createClient } from '@/lib/supabase/server';
import { Header } from '@/components/header';
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
      cafe_images(storage_path)
    `)
    .eq('status', 'active');

  if (error) {
    console.error('Error fetching cafes:', error);
    return [];
  }

  return (data || []).map((row) => {
    const images = row.cafe_images as { storage_path: string }[] | null;
    return transformCafeSummary({
      ...row,
      primary_image_url: images?.[0]?.storage_path || null,
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
