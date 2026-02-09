'use server';

import { createClient } from '@/lib/supabase/server';
import { getRecommendations } from '@/lib/supabase/recommendations';
import type { CafeSummary } from '@/types/cafe';

export async function getRecommendationsAction(limit: number = 6): Promise<{
  success: boolean;
  cafes: CafeSummary[];
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, cafes: [], error: 'Not authenticated' };
    }

    const cafes = await getRecommendations(supabase, user.id, limit);

    return { success: true, cafes };
  } catch (error) {
    console.error('Error getting recommendations:', error);
    return { success: false, cafes: [], error: 'Failed to get recommendations' };
  }
}
