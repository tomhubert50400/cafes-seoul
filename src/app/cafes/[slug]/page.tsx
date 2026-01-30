import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Header } from '@/components/header';
import { transformCafe, transformReview, transformUserRating, getStorageUrl } from '@/lib/supabase/transforms';
import { CafeDetailContent } from '@/components/cafe-detail/cafe-detail-content';
import type { Cafe, CafeImage } from '@/types/cafe';
import type { Review } from '@/types/review';
import type { UserRating } from '@/types/ratings';
import type { PhotoWithVoteStatus, PhotoStatus } from '@/types/photos';

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function getCafe(slug: string): Promise<{ cafe: Cafe; images: CafeImage[] } | null> {
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

  const { data: images } = await supabase
    .from('cafe_images')
    .select('id, storage_path, thumbnail_path, alt_text, is_primary, created_at')
    .eq('cafe_id', cafe.id)
    .eq('is_approved', true)
    .order('is_primary', { ascending: false })
    .order('created_at', { ascending: true });

  return {
    cafe: transformCafe(cafe),
    images: (images || []).map((img) => ({
      id: img.id,
      cafeId: cafe.id,
      storagePath: getStorageUrl(img.storage_path) || '',
      thumbnailPath: getStorageUrl(img.thumbnail_path),
      altText: img.alt_text || {},
      isPrimary: img.is_primary,
      createdAt: img.created_at,
    })),
  };
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
        url: supabase.storage.from('photos').getPublicUrl(photo.storage_path).data.publicUrl,
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
        url: supabase.storage.from('photos').getPublicUrl(photo.storage_path).data.publicUrl,
        hasVoted: false,
        isOwnPhoto: false,
      }));
    }
  } catch (err) {
    console.error('Unexpected error fetching photos:', err);
    return [];
  }
}

export default async function CafeDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const result = await getCafe(slug);

  if (!result) {
    notFound();
  }

  const { cafe, images } = result;
  const reviews = await getCafeReviews(cafe.id);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const userRating = await getUserRating(cafe.id, user?.id);
  const photos = await getCafePhotos(cafe.id, user?.id);

  return (
    <>
      <Header user={user} />
      <CafeDetailContent
        cafe={cafe}
        images={images}
        reviews={reviews}
        userRating={userRating}
        photos={photos}
      />
    </>
  );
}
