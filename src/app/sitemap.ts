import type { MetadataRoute } from 'next';
import { createClient } from '@/lib/supabase/server';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://cafes-seoul.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient();

  const { data: cafes } = await supabase
    .from('cafes')
    .select('slug, updated_at')
    .eq('status', 'active');

  const cafeEntries: MetadataRoute.Sitemap = (cafes || []).map((cafe) => ({
    url: `${BASE_URL}/cafes/${cafe.slug}`,
    lastModified: cafe.updated_at,
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, changeFrequency: 'daily', priority: 1 },
    { url: `${BASE_URL}/cafes`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE_URL}/map`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE_URL}/roulette`, changeFrequency: 'monthly', priority: 0.5 },
  ];

  return [...staticPages, ...cafeEntries];
}
