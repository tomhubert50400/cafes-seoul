import { FILTER_PRESETS } from '@/lib/filter-presets';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { UserVibe, CreateVibeInput, UpdateVibeInput } from '@/types/vibes';

// ============================================
// GET USER VIBES
// ============================================

export async function getUserVibes(
  supabase: SupabaseClient,
  userId: string
): Promise<UserVibe[]> {
  try {
    const { data, error } = await supabase
      .from('user_vibes')
      .select('*')
      .eq('user_id', userId)
      .order('position', { ascending: true });

    if (error) {
      console.error('Error fetching user vibes:', error);
      return [];
    }

    return (data || []).map(transformVibe);
  } catch (err) {
    console.error('Unexpected error fetching vibes:', err);
    return [];
  }
}

// ============================================
// GET VIBE COUNT (total)
// ============================================

export async function getVibeCount(
  supabase: SupabaseClient,
  userId: string
): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('user_vibes')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (error) {
      console.error('Error counting vibes:', error);
      return 0;
    }

    return count || 0;
  } catch (err) {
    console.error('Unexpected error counting vibes:', err);
    return 0;
  }
}

// ============================================
// SEED DEFAULT VIBES
// ============================================

/**
 * Seeds the 3 built-in presets as user vibes for a new user.
 * Only call when the user has 0 vibes.
 */
export async function seedDefaultVibes(
  supabase: SupabaseClient,
  userId: string
): Promise<UserVibe[]> {
  try {
    const defaultIds = ['work_study', 'aesthetic_date'];
    const defaultNames: Record<string, string> = {
      work_study: 'Work',
      aesthetic_date: 'Date Spot',
    };

    const defaults = FILTER_PRESETS.filter((p) => defaultIds.includes(p.id));
    const rows = defaults.map((preset, i) => ({
      user_id: userId,
      name: defaultNames[preset.id] || preset.id,
      icon: preset.icon,
      filters: preset.filters,
      default_preset_id: preset.id,
      position: i,
    }));

    const { data, error } = await supabase
      .from('user_vibes')
      .insert(rows)
      .select();

    if (error) {
      console.error('Error seeding default vibes:', error);
      return [];
    }

    return (data || []).map(transformVibe);
  } catch (err) {
    console.error('Unexpected error seeding vibes:', err);
    return [];
  }
}

// ============================================
// ENSURE USER VIBES (seed if empty)
// ============================================

export async function ensureUserVibes(
  supabase: SupabaseClient,
  userId: string
): Promise<UserVibe[]> {
  const vibes = await getUserVibes(supabase, userId);
  if (vibes.length > 0) return vibes;
  return seedDefaultVibes(supabase, userId);
}

// ============================================
// CREATE VIBE
// ============================================

export async function createVibe(
  supabase: SupabaseClient,
  userId: string,
  input: CreateVibeInput
): Promise<UserVibe | null> {
  try {
    const { data, error } = await supabase
      .from('user_vibes')
      .insert({
        user_id: userId,
        name: input.name,
        icon: input.icon,
        filters: input.filters,
        default_preset_id: null,
        position: 0,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating vibe:', error);
      return null;
    }

    return transformVibe(data);
  } catch (err) {
    console.error('Unexpected error creating vibe:', err);
    return null;
  }
}

// ============================================
// UPDATE VIBE
// ============================================

export async function updateVibe(
  supabase: SupabaseClient,
  userId: string,
  vibeId: string,
  input: UpdateVibeInput
): Promise<UserVibe | null> {
  try {
    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (input.name !== undefined) updateData.name = input.name;
    if (input.icon !== undefined) updateData.icon = input.icon;
    if (input.filters !== undefined) updateData.filters = input.filters;

    const { data, error } = await supabase
      .from('user_vibes')
      .update(updateData)
      .eq('id', vibeId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating vibe:', error);
      return null;
    }

    return transformVibe(data);
  } catch (err) {
    console.error('Unexpected error updating vibe:', err);
    return null;
  }
}

// ============================================
// DELETE VIBE
// ============================================

export async function deleteVibe(
  supabase: SupabaseClient,
  userId: string,
  vibeId: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('user_vibes')
      .delete()
      .eq('id', vibeId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting vibe:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Unexpected error deleting vibe:', err);
    return false;
  }
}

// ============================================
// TRANSFORM HELPER
// ============================================

function transformVibe(row: Record<string, unknown>): UserVibe {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    name: row.name as string,
    icon: row.icon as string,
    filters: (row.filters || {}) as UserVibe['filters'],
    position: row.position as number,
    defaultPresetId: (row.default_preset_id as string) || null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}
