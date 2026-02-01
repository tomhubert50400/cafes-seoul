'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getProfile, updateProfile } from '@/lib/supabase/profiles';
import { profileFormSchema } from '@/lib/validations/profile';
import type { ProfileFormData } from '@/lib/validations/profile';

/**
 * Get current user's profile
 */
export async function getMyProfile() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  const profile = await getProfile(supabase, user.id);
  return { success: true, profile };
}

/**
 * Update profile (display name, bio)
 * Syncs display_name to auth.users.user_metadata for JWT
 */
export async function updateProfileAction(
  data: ProfileFormData
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    // Validate input
    const validation = profileFormSchema.safeParse(data);
    if (!validation.success) {
      const issues = validation.error.issues.map(i => i.message).join(', ');
      return { success: false, error: `Validation failed: ${issues}` };
    }

    const { display_name, bio } = validation.data;

    // 1. Update profiles table
    const result = await updateProfile(supabase, user.id, {
      display_name,
      bio: bio || null,
    });

    if (!result.success) {
      return result;
    }

    // 2. Sync display_name to auth.users metadata (for JWT)
    const { error: authError } = await supabase.auth.updateUser({
      data: { display_name },
    });

    if (authError) {
      console.error('Auth metadata update failed:', authError);
      // Don't fail - profile is updated, metadata is secondary
    }

    revalidatePath('/profile');
    revalidatePath('/profile/settings');

    return { success: true };
  } catch (err) {
    console.error('Unexpected error updating profile:', err);
    return { success: false, error: 'Failed to update profile' };
  }
}

/**
 * Upload avatar to Supabase Storage
 * Saves cropped blob, updates profile with new path
 */
export async function uploadAvatarAction(
  formData: FormData
): Promise<{ success: boolean; avatarUrl?: string; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    const file = formData.get('avatar') as File;
    if (!file || file.size === 0) {
      return { success: false, error: 'No file provided' };
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      return { success: false, error: 'File size exceeds 5MB limit' };
    }

    // Generate unique filename (prevents caching issues)
    const fileExt = 'jpg'; // Cropped images are always JPEG
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${user.id}/${fileName}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, {
        contentType: 'image/jpeg',
        upsert: false,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return { success: false, error: 'Failed to upload file' };
    }

    // Update profile with new avatar path
    const result = await updateProfile(supabase, user.id, {
      avatar_url: filePath,
    });

    if (!result.success) {
      return { success: false, error: 'Failed to update profile with avatar' };
    }

    // Get public URL for immediate display
    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    revalidatePath('/profile');
    revalidatePath('/profile/settings');

    return { success: true, avatarUrl: urlData.publicUrl };
  } catch (err) {
    console.error('Unexpected error uploading avatar:', err);
    return { success: false, error: 'Failed to upload avatar' };
  }
}

/**
 * Update privacy setting
 */
export async function updatePrivacyAction(
  isPrivate: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    const result = await updateProfile(supabase, user.id, {
      is_private: isPrivate,
    });

    if (!result.success) {
      return result;
    }

    revalidatePath('/profile');
    return { success: true };
  } catch (err) {
    console.error('Unexpected error updating privacy:', err);
    return { success: false, error: 'Failed to update privacy setting' };
  }
}
