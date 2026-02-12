import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { transformCafe, transformCafeSummary, transformReview, transformUserRating, getStorageUrl } from '@/lib/supabase/transforms';
import { CafeDetailContent } from '@/components/cafe-detail/cafe-detail-content';
import { checkFavoriteAction } from '@/lib/actions/favorites';
import { getCafeReviewsAction } from '@/lib/actions/reviews';
import type { Cafe, CafeSummary } from '@/types/cafe';
import type { Review } from '@/types/review';
import type { UserRating } from '@/types/ratings';
import type { PhotoWithVoteStatus, PhotoStatus } from '@/types/photos';
import type { User, UserRole } from '@/types/user';
import type { ReviewWithAuthor } from '@/types/reviews';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const cafe = await getCafe(slug);

  if (!cafe) {
    return { title: 'Cafe Not Found' };
  }

  const cafeName = cafe.name.en || cafe.name.ko || Object.values(cafe.name)[0] || 'Cafe';
  const cafeAddress = cafe.address.en || cafe.address.ko || Object.values(cafe.address)[0] || 'Seoul';

  // Get the top photo for OG image
  const supabase = await createClient();
  const { data: topPhoto } = await supabase
    .from('photos')
    .select('storage_path')
    .eq('cafe_id', cafe.id)
    .eq('status', 'approved')
    .order('upvote_count', { ascending: false })
    .limit(1)
    .maybeSingle();

  const imageUrl = topPhoto ? getStorageUrl(topPhoto.storage_path) : null;

  const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://cafes-seoul.com';

  return {
    title: cafeName,
    description: `${cafeName} in ${cafeAddress}. ${cafe.overallRating ? `Rated ${cafe.overallRating.toFixed(1)}/5` : 'Discover this cafe'} on Seoul Cafe Guide.`,
    alternates: {
      canonical: `${BASE_URL}/cafes/${slug}`,
    },
    openGraph: {
      title: cafeName,
      description: `${cafeName} - ${cafeAddress}`,
      url: `${BASE_URL}/cafes/${slug}`,
      ...(imageUrl && { images: [{ url: imageUrl, alt: cafeName }] }),
    },
    twitter: {
      card: imageUrl ? 'summary_large_image' : 'summary',
      title: cafeName,
      description: `${cafeName} - ${cafeAddress}`,
      ...(imageUrl && { images: [imageUrl] }),
    },
  };
}

async function getCafe(slug: string): Promise<Cafe | null> {
  const supabase = await createClient();

  const { data: cafe, error } = await supabase
    .from('cafes')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'active')
    .single();

  if (error || !cafe) {
    return null;
  }

  return transformCafe(cafe);
}

async function getCafeReviews(cafeId: string): Promise<Review[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('reviews')
    .select(
      `
      *,
      profiles:user_id (
        id,
        username,
        display_name,
        avatar_url,
        is_verified,
        total_reviews
      )
    `
    )
    .eq('cafe_id', cafeId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(10);

  if (error || !data) {
    return [];
  }

  return data.map((row) => transformReview(row));
}

async function getUserRating(cafeId: string, userId: string | undefined): Promise<UserRating | null> {
  if (!userId) return null;

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('cafe_ratings')
    .select('*')
    .eq('cafe_id', cafeId)
    .eq('user_id', userId)
    .single();

  // PGRST116 = not found (user hasn't rated this cafe yet)
  if (error && error.code === 'PGRST116') {
    return null;
  }

  if (error) {
    console.error('Error fetching user rating:', error);
    return null;
  }

  return data ? transformUserRating(data) : null;
}

async function getCafePhotos(
  cafeId: string,
  userId: string | undefined
): Promise<PhotoWithVoteStatus[]> {
  const supabase = await createClient();

  try {
    // Build base query
    let query = supabase
      .from('photos')
      .select(
        `
        id,
        cafe_id,
        user_id,
        storage_path,
        status,
        upvote_count,
        created_at
      `
      )
      .eq('cafe_id', cafeId);

    // Apply visibility filter:
    // - Approved photos visible to all
    // - User's own photos (any status) visible to them
    if (userId) {
      // For authenticated users: show approved + their own photos
      const { data: photos, error } = await query.or(
        `status.eq.approved,and(user_id.eq.${userId})`
      );

      if (error) {
        console.error('Error fetching photos:', error);
        return [];
      }

      if (!photos || photos.length === 0) {
        return [];
      }

      // Get user's votes for these photos
      const photoIds = photos.map((p) => p.id);
      const { data: votes } = await supabase
        .from('photo_votes')
        .select('photo_id')
        .eq('user_id', userId)
        .in('photo_id', photoIds);

      const userVotes = new Set(votes?.map((v) => v.photo_id) || []);

      // Transform to PhotoWithVoteStatus
      return photos.map((photo) => ({
        id: photo.id,
        storage_path: photo.storage_path,
        status: photo.status as PhotoStatus,
        upvote_count: photo.upvote_count,
        upvoteCount: photo.upvote_count,
        created_at: photo.created_at,
        url: supabase.storage.from('cafe-images').getPublicUrl(photo.storage_path).data.publicUrl,
        hasVoted: userVotes.has(photo.id),
        isOwnPhoto: photo.user_id === userId,
      }));
    } else {
      // For guests: show only approved photos
      const { data: photos, error } = await query
        .eq('status', 'approved')
        .order('upvote_count', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(6);

      if (error) {
        console.error('Error fetching photos:', error);
        return [];
      }

      if (!photos || photos.length === 0) {
        return [];
      }

      // Transform to PhotoWithVoteStatus (no votes for guests)
      return photos.map((photo) => ({
        id: photo.id,
        storage_path: photo.storage_path,
        status: photo.status as PhotoStatus,
        upvote_count: photo.upvote_count,
        upvoteCount: photo.upvote_count,
        created_at: photo.created_at,
        url: supabase.storage.from('cafe-images').getPublicUrl(photo.storage_path).data.publicUrl,
        hasVoted: false,
        isOwnPhoto: false,
      }));
    }
  } catch (err) {
    console.error('Unexpected error fetching photos:', err);
    return [];
  }
}

const CAFE_SUMMARY_SELECT = `
  id, name, slug, address, district_id,
  latitude, longitude,
  overall_rating, total_ratings,
  rating_food, rating_drinks, rating_temperature, rating_seating,
  rating_ambiance, rating_wifi, rating_noise, rating_outlets, rating_value,
  price_range, cafe_type,
  has_wifi, has_power_outlets, is_pet_friendly, is_laptop_friendly, has_parking,
  operating_hours,
  photos(storage_path, upvote_count, status)
`;

type PhotoRow = { storage_path: string; upvote_count: number; status: string };

async function getSimilarCafes(cafe: Cafe): Promise<CafeSummary[]> {
  const supabase = await createClient();

  // Fetch cafes with same type, excluding current cafe
  const { data: sameType } = await supabase
    .from('cafes')
    .select(CAFE_SUMMARY_SELECT)
    .eq('cafe_type', cafe.cafeType)
    .eq('status', 'active')
    .neq('id', cafe.id)
    .order('overall_rating', { ascending: false })
    .limit(4);

  const results = (sameType || []).map((row) => {
    const photos = row.photos as PhotoRow[] | null;
    const topPhoto = photos
      ?.filter((p) => p.status === 'approved')
      .sort((a, b) => b.upvote_count - a.upvote_count)[0];
    return transformCafeSummary({
      ...row,
      primary_image_url: topPhoto?.storage_path || null,
    });
  });

  // If fewer than 4 results, fill with same district cafes
  if (results.length < 4) {
    const existingIds = [cafe.id, ...results.map((c) => c.id)];
    const { data: sameDistrict } = await supabase
      .from('cafes')
      .select(CAFE_SUMMARY_SELECT)
      .eq('district_id', cafe.districtId)
      .eq('status', 'active')
      .not('id', 'in', `(${existingIds.join(',')})`)
      .order('overall_rating', { ascending: false })
      .limit(4 - results.length);

    if (sameDistrict) {
      for (const row of sameDistrict) {
        const photos = row.photos as PhotoRow[] | null;
        const topPhoto = photos
          ?.filter((p) => p.status === 'approved')
          .sort((a, b) => b.upvote_count - a.upvote_count)[0];
        results.push(transformCafeSummary({
          ...row,
          primary_image_url: topPhoto?.storage_path || null,
        }));
      }
    }
  }

  return results;
}

export default async function CafeDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const cafe = await getCafe(slug);

  if (!cafe) {
    notFound();
  }
  const reviews = await getCafeReviews(cafe.id);

  // Fetch text reviews (from cafe_ratings with review_text)
  const textReviewsResult = await getCafeReviewsAction(cafe.id);
  const textReviews: ReviewWithAuthor[] = textReviewsResult.success && textReviewsResult.reviews
    ? textReviewsResult.reviews
    : [];

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const userRating = await getUserRating(cafe.id, user?.id);
  const photos = await getCafePhotos(cafe.id, user?.id);

  // Fetch similar cafes and check favorites in parallel
  const [similarCafes, isFavoritedResult] = await Promise.all([
    getSimilarCafes(cafe),
    user ? checkFavoriteAction(cafe.id) : Promise.resolve({ success: false, isFavorited: false }),
  ]);
  const isFavorited = isFavoritedResult.success && isFavoritedResult.isFavorited === true;

  // Fetch user profile to get role
  let currentUser: User | null = null;
  if (user) {
    // Use service role to fetch profile since regular users might not have SELECT permission on all fields
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError) {
      console.error('Error fetching profile for role check:', profileError.message);
    }

    // Create currentUser with role from profile
    currentUser = {
      id: user.id,
      email: user.email || '',
      username: '',
      displayName: null,
      avatarUrl: null,
      bio: null,
      preferredLanguage: 'en',
      isModerator: false,
      isVerified: false,
      role: (profile?.role as UserRole) || 'user',
      roleUpdatedAt: null,
      totalReviews: 0,
      totalHelpfulVotes: 0,
      createdAt: '',
      updatedAt: '',
    };
  }

  return (
    <>
      <CafeDetailContent
        cafe={cafe}
        reviews={reviews}
        textReviews={textReviews}
        userRating={userRating}
        photos={photos}
        currentUser={currentUser}
        isFavorited={isFavorited}
        similarCafes={similarCafes}
      />
    </>
  );
}
