import { headers } from 'next/headers';
import { unstable_cache } from 'next/cache';
import { Footer } from '@/components/footer';
import { Header } from '@/components/header';
import { HeroSection } from '@/components/home/hero-section';
import { FeaturedSection } from '@/components/home/featured-section';
import { RecommendationsSection } from '@/components/home/recommendations-section';

import { FeaturesSection } from '@/components/home/features-section';
import { CtaSection } from '@/components/home/cta-section';
import { fetchCafes } from '@/lib/api/cafes';
import { createClient } from '@/lib/supabase/server';
import { getRecommendations } from '@/lib/supabase/recommendations';
import type { CafeSummary } from '@/types/cafe';

const getFeaturedCafes = unstable_cache(
  async (baseUrl: string): Promise<CafeSummary[]> => {
    try {
      const response = await fetchCafes(
        { limit: 6, sortBy: 'rating', sortOrder: 'desc' },
        baseUrl
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching featured cafes:', error);
      return [];
    }
  },
  ['featured-cafes'],
  { revalidate: 3600, tags: ['cafes'] }
);

export default async function HomePage() {
  const headersList = await headers();
  const host = headersList.get('host') || 'localhost:3000';
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
  const baseUrl = `${protocol}://${host}`;

  const [featuredCafes, supabase] = await Promise.all([
    getFeaturedCafes(baseUrl),
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

  const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://cafes-seoul.com';

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Seoul Cafe Guide',
    alternateName: '서울 카페 가이드',
    url: BASE_URL,
    description: 'Discover the best cafes in Seoul. Rate, review, and find your perfect cafe.',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${BASE_URL}/cafes?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <div className="min-h-screen bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Header user={user} />
      <HeroSection />
      {user && recommendedCafes.length > 0 ? (
        <RecommendationsSection cafes={recommendedCafes} />
      ) : (
        <FeaturedSection cafes={featuredCafes} />
      )}

      <FeaturesSection />
      <CtaSection />
      <Footer />
    </div>
  );
}
