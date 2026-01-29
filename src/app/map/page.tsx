import { createClient } from '@/lib/supabase/server';
import { Header } from '@/components/header';
import { CafeMapWrapperDynamic } from '@/components/map/cafe-map-dynamic';
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
      ratings,
      price_range, cafe_type, 
      has_wifi, has_power_outlets, is_pet_friendly, is_laptop_friendly, has_parking,
      primary_image_url
    `)
    .neq('status', 'closed');
  
  if (error) {
    console.error('Error fetching cafes:', error);
    return [];
  }
  
  return (data || []).map(transformCafeSummary);
}

export default async function MapPage() {
  const cafes = await getCafes();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen flex flex-col">
      <Header user={user} />
      <main className="flex-1 h-[calc(100vh-3.5rem)]">
        <CafeMapWrapperDynamic cafes={cafes} />
      </main>
    </div>
  );
}
