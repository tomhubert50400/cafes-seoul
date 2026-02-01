'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getProfile, updateProfile } from '@/lib/supabase/profiles';
import { profileFormSchema } from '@/lib/validations/profile';
import type { ProfileFormData } from '@/lib/validations/profile';

/**
 * Sync profile from auth metadata (for OAuth users)
 * Populates display_name and avatar_url from OAuth provider data if missing
 */
export async function syncProfileFromAuthMetadata(): Promise<{
  success: boolean;
  synced: boolean;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, synced: false, error: 'Not authenticated' };
    }

    // Get current profile
    const profile = await getProfile(supabase, user.id);
    if (!profile) {
      return { success: false, synced: false, error: 'Profile not found' };
    }

    // Check if we need to sync (missing display_name or avatar_url)
    const metadata = user.user_metadata;
    const updates: { display_name?: string; avatar_url?: string } = {};

    // Sync display_name from OAuth if profile doesn't have one
    if (!profile.display_name) {
      const oauthName = metadata?.full_name || metadata?.name;
      if (oauthName) {
        updates.display_name = oauthName;
      }
    }

    // Sync avatar_url from OAuth if profile doesn't have one
    if (!profile.avatar_url) {
      const oauthAvatar = metadata?.avatar_url || metadata?.picture;
      if (oauthAvatar) {
        updates.avatar_url = oauthAvatar;
      }
    }

    // Nothing to sync
    if (Object.keys(updates).length === 0) {
      return { success: true, synced: false };
    }

    // Update profile with OAuth data
    const result = await updateProfile(supabase, user.id, updates);
    if (!result.success) {
      return { success: false, synced: false, error: result.error };
    }

    revalidatePath('/profile');
    revalidatePath('/profile/settings');

    return { success: true, synced: true };
  } catch (err) {
    console.error('Error syncing profile from auth metadata:', err);
    return { success: false, synced: false, error: 'Failed to sync profile' };
  }
}

/**
 * Get current user's profile
 * Automatically syncs from auth metadata if profile data is missing (OAuth users)
 */
export async function getMyProfile() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  // First, sync any missing data from OAuth metadata
  await syncProfileFromAuthMetadata();

  // Then fetch the (potentially updated) profile
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

// ============================================
// ACCOUNT DELETION ACTIONS
// ============================================

/**
 * Schedule account for deletion with 7-day grace period
 * User must type their email to confirm
 */
export async function scheduleAccountDeletionAction(
  confirmEmail: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    // Verify email matches
    if (user.email !== confirmEmail) {
      return { success: false, error: 'Email does not match' };
    }

    // Calculate deletion date (7 days from now)
    const deletionDate = new Date();
    deletionDate.setDate(deletionDate.getDate() + 7);

    // Update profile with scheduled deletion
    const { error } = await supabase
      .from('profiles')
      .update({
        scheduled_deletion_at: deletionDate.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (error) {
      console.error('Error scheduling deletion:', error);
      return { success: false, error: 'Failed to schedule deletion' };
    }

    // Sign out the user
    await supabase.auth.signOut();

    revalidatePath('/');
    return { success: true };
  } catch (err) {
    console.error('Unexpected error scheduling deletion:', err);
    return { success: false, error: 'Failed to schedule deletion' };
  }
}

/**
 * Cancel scheduled account deletion
 * Can be called by user during grace period
 */
export async function cancelAccountDeletionAction(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    // Clear scheduled deletion
    const { error } = await supabase
      .from('profiles')
      .update({
        scheduled_deletion_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (error) {
      console.error('Error canceling deletion:', error);
      return { success: false, error: 'Failed to cancel deletion' };
    }

    revalidatePath('/profile');
    revalidatePath('/profile/settings');
    return { success: true };
  } catch (err) {
    console.error('Unexpected error canceling deletion:', err);
    return { success: false, error: 'Failed to cancel deletion' };
  }
}

/**
 * Reactivate account on login (clears scheduled_deletion_at)
 * Called from profile layout when user logs in during grace period
 */
export async function reactivateAccountIfScheduled(): Promise<void> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return;

    // Check if account is scheduled for deletion
    const { data: profile } = await supabase
      .from('profiles')
      .select('scheduled_deletion_at')
      .eq('id', user.id)
      .single();

    if (profile?.scheduled_deletion_at) {
      // User logged in during grace period - reactivate
      await supabase
        .from('profiles')
        .update({
          scheduled_deletion_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);
    }
  } catch (err) {
    console.error('Error checking/reactivating account:', err);
  }
}
