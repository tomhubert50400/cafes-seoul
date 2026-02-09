import { headers } from 'next/headers';
import { Footer } from '@/components/footer';
import { Header } from '@/components/header';
import { HeroSection } from '@/components/home/hero-section';
import { FeaturedSection } from '@/components/home/featured-section';
import { RecommendationsSection } from '@/components/home/recommendations-section';
import { DistrictsSection } from '@/components/home/districts-section';
import { FeaturesSection } from '@/components/home/features-section';
import { CtaSection } from '@/components/home/cta-section';
import { fetchCafes } from '@/lib/api/cafes';
import { createClient } from '@/lib/supabase/server';
import { getRecommendations } from '@/lib/supabase/recommendations';
import type { CafeSummary } from '@/types/cafe';

async function getFeaturedCafes(): Promise<CafeSummary[]> {
  const headersList = await headers();
  const host = headersList.get('host') || 'localhost:3000';
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';

  try {
    const response = await fetchCafes(
      { limit: 6, sortBy: 'rating', sortOrder: 'desc' },
      `${protocol}://${host}`
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching featured cafes:', error);
    return [];
  }
}

export default async function HomePage() {
  const [featuredCafes, supabase] = await Promise.all([
    getFeaturedCafes(),
    createClient(),
  ]);
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch personalized recommendations for logged-in users
  let recommendedCafes: CafeSummary[] = [];
  if (user) {
    try {
      recommendedCafes = await getRecommendations(supabase, user.id, 6);
    } catch {
      // Silently fail - recommendations are non-critical
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header user={user} />
      <HeroSection />
      {user && recommendedCafes.length > 0 ? (
        <RecommendationsSection cafes={recommendedCafes} />
      ) : (
        <FeaturedSection cafes={featuredCafes} />
      )}
      <DistrictsSection />
      <FeaturesSection />
      <CtaSection />
      <Footer />
    </div>
  );
}
