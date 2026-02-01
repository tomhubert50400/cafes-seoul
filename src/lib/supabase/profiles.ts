import type { SupabaseClient } from '@supabase/supabase-js';
import type { ProfileWithPrivacy } from '@/types/profile';

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
