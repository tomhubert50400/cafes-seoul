import { Metadata } from 'next';
import { cookies } from 'next/headers';
import { getMyRatingsWithImages } from '@/lib/actions/ratings';
import { MyReviewsList } from '@/components/reviews/my-reviews-list';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { getTranslation } from '@/lib/i18n/translations';
import { LanguageCode, DEFAULT_LANGUAGE, LANGUAGE_COOKIE_NAME } from '@/lib/i18n/languages';
import { createClient } from '@/lib/supabase/server';
import { getLocalizedText } from '@/types/cafe';
import { getDistrictById } from '@/lib/constants/districts';

async function getLanguageFromCookies(): Promise<LanguageCode> {
  const cookieStore = await cookies();
  const langCookie = cookieStore.get(LANGUAGE_COOKIE_NAME);

  if (langCookie?.value && ['en', 'ko', 'fr', 'zh', 'vi'].includes(langCookie.value)) {
    return langCookie.value as LanguageCode;
  }

  return DEFAULT_LANGUAGE;
}

export const metadata: Metadata = {
  title: 'My Reviews | Cafes Seoul',
  description: 'View your cafe reviews and ratings',
};

export default async function ReviewsPage() {
  const lang = await getLanguageFromCookies();

  // Fetch user's ratings with cafe images
  const result = await getMyRatingsWithImages();

  if (!result.success || !result.ratings) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{getTranslation(lang, 'reviews.title')}</CardTitle>
          <CardDescription>Failed to load reviews. Please try again.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Fetch popular cafes for empty state suggestion
  // Get top 3 cafes by total_ratings for suggestions with images
  const supabase = await createClient();
  const { data: popularCafesData } = await supabase
    .from('cafes')
    .select(`
      slug,
      name,
      district_id,
      cafe_images(storage_path)
    `)
    .eq('status', 'active')
    .order('total_ratings', { ascending: false })
    .limit(3);

  const popularCafes = popularCafesData?.map(cafe => {
    const images = cafe.cafe_images as Array<{ storage_path: string }> | null;
    const primaryImage = images?.[0]?.storage_path || null;
    const district = getDistrictById(cafe.district_id);

    return {
      slug: cafe.slug,
      name: getLocalizedText(cafe.name as Record<string, string>, lang),
      imageUrl: primaryImage ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/cafe-images/${primaryImage}` : null,
      area: district ? getLocalizedText(district.name, lang) : null,
    };
  }) || [];

  return (
    <>
      <Card className="border-none shadow-none bg-transparent">
        <CardHeader className="px-0">
          <CardTitle className="text-3xl font-bold">
            {getTranslation(lang, 'reviews.title')}
          </CardTitle>
          <CardDescription className="text-lg">
            {getTranslation(lang, 'reviews.subtitle')}
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="mt-4">
        <MyReviewsList
          reviews={result.ratings}
          popularCafes={popularCafes}
        />
      </div>
    </>
  );
}
