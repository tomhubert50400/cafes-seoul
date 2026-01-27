import { headers } from 'next/headers';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { HeroSection } from '@/components/home/hero-section';
import { FeaturedSection } from '@/components/home/featured-section';
import { DistrictsSection } from '@/components/home/districts-section';
import { FeaturesSection } from '@/components/home/features-section';
import { CtaSection } from '@/components/home/cta-section';
import { fetchCafes } from '@/lib/api/cafes';
import { createClient } from '@/lib/supabase/server';
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

  return (
    <div className="min-h-screen bg-background">
      <Header user={user} />
      <HeroSection />
      <FeaturedSection cafes={featuredCafes} />
      <DistrictsSection />
      <FeaturesSection />
      <CtaSection />
      <Footer />
    </div>
  );
}
