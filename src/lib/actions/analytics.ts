'use server';

import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import type { TrackEventPayload } from '@/types/analytics';

/**
 * Track an analytics event.
 * Uses service role client to bypass RLS (no public INSERT policy).
 * Attaches user_id from session if logged in.
 * Fire-and-forget on client side.
 */
export async function trackEvent(payload: TrackEventPayload): Promise<void> {
  try {
    let userId: string | null = null;
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      userId = user?.id ?? null;
    } catch {
      // Not logged in
    }

    const serviceClient = createServiceRoleClient();

    await serviceClient.from('analytics_events').insert({
      user_id: userId,
      session_id: payload.sessionId,
      event_type: payload.eventType,
      event_data: payload.eventData ?? {},
      page_path: payload.pagePath,
      referrer_page: payload.referrerPage,
      latitude: payload.latitude,
      longitude: payload.longitude,
      district: payload.district,
      browser_language: payload.browserLanguage,
      device_type: payload.deviceType,
    });
  } catch (err) {
    console.error('[Analytics] Failed to track event:', err);
  }
}
