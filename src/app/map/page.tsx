import { createClient } from '@/lib/supabase/server';
import { Header } from '@/components/header';
import { CafeMapWrapperDynamic } from '@/components/map/cafe-map-dynamic';
import { transformCafeSummary } from '@/lib/supabase/transforms';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Plus } from 'lucide-react';
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
      has_wifi, has_power_outlets, is_pet_friendly, is_laptop_friendly, has_parking
    `)
    .eq('status', 'active');
  
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
    <div className="min-h-screen flex flex-col" style={{ height: '100vh' }}>
      <Header user={user} />
      <main 
        className="flex-1 relative overflow-hidden"
        style={{ height: 'calc(100vh - 56px)', minHeight: '500px' }}
      >
        <div className="absolute inset-0 w-full h-full">
          <CafeMapWrapperDynamic cafes={cafes} />
        </div>
        
        {/* Add Cafe Button - Floating Action Button */}
        <div className="absolute bottom-6 right-6 z-50">
          <Button asChild size="lg" className="shadow-lg">
            <Link href="/submit">
              <Plus className="h-5 w-5 mr-2" />
              <span className="hidden sm:inline">Add Cafe</span>
            </Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
