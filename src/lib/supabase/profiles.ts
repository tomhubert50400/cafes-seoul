import type { SupabaseClient } from '@supabase/supabase-js';
import type { ProfileWithPrivacy, PublicProfile } from '@/types/profile';

/**
 * Get profile by user ID
 * Includes privacy and deletion fields for settings page
 */
export async function getProfile(
  supabase: SupabaseClient,
  userId: string
): Promise<ProfileWithPrivacy | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching profile:', error);
    return null;
  }

  return data as ProfileWithPrivacy;
}

/**
 * Update profile fields
 * Only updates provided fields (partial update)
 */
export async function updateProfile(
  supabase: SupabaseClient,
  userId: string,
  data: {
    display_name?: string;
    bio?: string | null;
    avatar_url?: string | null;
    is_private?: boolean;
  }
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('profiles')
    .update({
      ...data,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (error) {
    console.error('Error updating profile:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Get avatar storage URL from path
 * Avatars bucket is public, so we use public URLs
 */
export function getAvatarUrl(
  supabase: SupabaseClient,
  avatarPath: string | null
): string | null {
  if (!avatarPath) return null;

  const { data } = supabase.storage
    .from('avatars')
    .getPublicUrl(avatarPath);

  return data.publicUrl;
}

/**
 * Get public profile by user ID
 * Returns null if profile is private or doesn't exist
 * Only returns public-safe fields (no email, no private data)
 */
export async function getPublicProfile(
  supabase: SupabaseClient,
  userId: string
): Promise<{ profile: PublicProfile | null; isPrivate: boolean }> {
  const { data, error } = await supabase
    .from('profiles')
    .select(`
      id,
      username,
      display_name,
      avatar_url,
      bio,
      total_reviews,
      created_at,
      is_private
    `)
    .eq('id', userId)
    .single();

  if (error || !data) {
    return { profile: null, isPrivate: false };
  }

  // Check privacy setting
  if (data.is_private) {
    return { profile: null, isPrivate: true };
  }

  // Return public profile data (without is_private field)
  const { is_private, ...publicData } = data;
  return {
    profile: publicData as PublicProfile,
    isPrivate: false,
  };
}

/**
 * Get profile for display (checks ownership)
 * Returns full profile if viewer is owner, public profile otherwise
 */
export async function getProfileForViewer(
  supabase: SupabaseClient,
  profileUserId: string,
  viewerUserId: string | null
): Promise<{
  profile: PublicProfile | ProfileWithPrivacy | null;
  isOwner: boolean;
  isPrivate: boolean;
}> {
  // If viewer is owner, return full profile
  if (viewerUserId === profileUserId) {
    const profile = await getProfile(supabase, profileUserId);
    return {
      profile,
      isOwner: true,
      isPrivate: false,
    };
  }

  // Otherwise return public profile
  const { profile, isPrivate } = await getPublicProfile(supabase, profileUserId);
  return {
    profile,
    isOwner: false,
    isPrivate,
  };
}
