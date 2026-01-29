import dynamic from 'next/dynamic';
import { createClient } from '@/lib/supabase/server';
import { Header } from '@/components/header';
import { transformCafeSummary } from '@/lib/supabase/transforms';
import type { CafeSummary } from '@/types/cafe';

// Dynamic import with SSR disabled for map components
const CafeMapWrapper = dynamic(
  () => import('@/components/map/cafe-map-wrapper').then((mod) => mod.CafeMapWrapper),
  { 
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center bg-muted/20">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
          <p className="mt-2 text-sm text-muted-foreground">Loading map...</p>
        </div>
      </div>
    )
  }
);

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
        <CafeMapWrapper cafes={cafes} />
      </main>
    </div>
  );
}
