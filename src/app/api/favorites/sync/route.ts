import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * POST /api/favorites/sync
 * Batch-sync favorites from the For You page.
 * Body: { added: string[], removed: string[] }
 *
 * - `added`: cafe IDs to add as favorites
 * - `removed`: cafe IDs to remove from favorites
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const MAX_BATCH_SIZE = 100;
    const added: string[] = (Array.isArray(body.added) ? body.added.filter((id: unknown) => typeof id === 'string' && UUID_RE.test(id)) : []).slice(0, MAX_BATCH_SIZE);
    const removed: string[] = (Array.isArray(body.removed) ? body.removed.filter((id: unknown) => typeof id === 'string' && UUID_RE.test(id)) : []).slice(0, MAX_BATCH_SIZE);

    if (added.length === 0 && removed.length === 0) {
      return NextResponse.json({ ok: true });
    }

    // Insert new favorites (ignore duplicates)
    if (added.length > 0) {
      const rows = added.map((cafeId) => ({
        user_id: user.id,
        cafe_id: cafeId,
      }));
      await supabase
        .from('user_favorites')
        .upsert(rows, { onConflict: 'user_id,cafe_id', ignoreDuplicates: true });
    }

    // Remove unfavorited
    if (removed.length > 0) {
      await supabase
        .from('user_favorites')
        .delete()
        .eq('user_id', user.id)
        .in('cafe_id', removed);
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 });
  }
}
