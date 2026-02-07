'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import {
  ensureUserVibes,
  getVibeCount,
  createVibe,
  updateVibe,
  deleteVibe,
} from '@/lib/supabase/vibes';
import { vibeFormSchema } from '@/lib/validations/vibes';
import { MAX_VIBES } from '@/lib/validations/vibes';
import { DEFAULT_LANGUAGE, LANGUAGE_COOKIE_NAME } from '@/lib/i18n/languages';
import type { LanguageCode } from '@/lib/i18n/languages';
import type { UserVibe, VibeActionResult } from '@/types/vibes';

async function getLang(): Promise<LanguageCode> {
  const cookieStore = await cookies();
  const val = cookieStore.get(LANGUAGE_COOKIE_NAME)?.value;
  if (val && ['en', 'ko', 'fr', 'zh', 'vi'].includes(val)) return val as LanguageCode;
  return DEFAULT_LANGUAGE;
}

// ============================================
// GET VIBES ACTION (auto-seeds defaults)
// ============================================

export async function getVibesAction(): Promise<{
  success: boolean;
  vibes?: UserVibe[];
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Authentication required' };
    }

    const lang = await getLang();
    const vibes = await ensureUserVibes(supabase, user.id, lang);
    return { success: true, vibes };
  } catch (err) {
    console.error('Unexpected error fetching vibes:', err);
    return { success: false, error: 'Failed to fetch vibes' };
  }
}

// ============================================
// CREATE VIBE ACTION
// ============================================

export async function createVibeAction(data: {
  name: string;
  icon: string;
  filters: Record<string, unknown>;
}): Promise<VibeActionResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Authentication required' };
    }

    // Validate input
    const parsed = vibeFormSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message || 'Invalid input' };
    }

    // Enforce total max vibes
    const count = await getVibeCount(supabase, user.id);
    if (count >= MAX_VIBES) {
      return { success: false, error: `Maximum ${MAX_VIBES} vibes reached` };
    }

    const vibe = await createVibe(supabase, user.id, {
      name: parsed.data.name,
      icon: parsed.data.icon,
      filters: parsed.data.filters as Record<string, unknown>,
    });

    if (!vibe) {
      return { success: false, error: 'Failed to create vibe' };
    }

    revalidatePath('/profile');
    return { success: true, vibe };
  } catch (err) {
    console.error('Unexpected error creating vibe:', err);
    return { success: false, error: 'Failed to create vibe' };
  }
}

// ============================================
// UPDATE VIBE ACTION
// ============================================

export async function updateVibeAction(
  vibeId: string,
  data: {
    name?: string;
    icon?: string;
    filters?: Record<string, unknown>;
  }
): Promise<VibeActionResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Authentication required' };
    }

    // Validate partial input
    if (data.name !== undefined) {
      if (data.name.length < 1 || data.name.length > 10) {
        return { success: false, error: 'Name must be 1-10 characters' };
      }
    }

    const vibe = await updateVibe(supabase, user.id, vibeId, data);

    if (!vibe) {
      return { success: false, error: 'Failed to update vibe' };
    }

    revalidatePath('/profile');
    return { success: true, vibe };
  } catch (err) {
    console.error('Unexpected error updating vibe:', err);
    return { success: false, error: 'Failed to update vibe' };
  }
}

// ============================================
// DELETE VIBE ACTION
// ============================================

export async function deleteVibeAction(vibeId: string): Promise<VibeActionResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Authentication required' };
    }

    const success = await deleteVibe(supabase, user.id, vibeId);

    if (!success) {
      return { success: false, error: 'Failed to delete vibe' };
    }

    revalidatePath('/profile');
    return { success: true };
  } catch (err) {
    console.error('Unexpected error deleting vibe:', err);
    return { success: false, error: 'Failed to delete vibe' };
  }
}
