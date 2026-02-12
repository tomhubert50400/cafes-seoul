import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Verify that a user has the admin role.
 * Shared utility used by server actions that require admin access.
 */
export async function verifyAdminRole(supabase: SupabaseClient, userId: string): Promise<boolean> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();

  return profile?.role === 'admin';
}
