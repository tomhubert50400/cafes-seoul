import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthDate = monthStart.toISOString().slice(0, 10);

  const { data: cafes } = await supabase
    .from('cafes')
    .select('id')
    .eq('status', 'active');

  if (!cafes?.length) {
    return new Response(JSON.stringify({ message: 'No cafes to aggregate' }), { status: 200 });
  }

  const stats = [];

  for (const cafe of cafes) {
    const cafeId = cafe.id;

    const { data: events } = await supabase
      .from('analytics_events')
      .select('*')
      .gte('created_at', monthStart.toISOString())
      .lt('created_at', monthEnd.toISOString())
      .or(`event_data->>cafe_id.eq.${cafeId},event_data->cafe_ids.cs.["${cafeId}"]`);

    if (!events?.length) continue;

    const impressionEvents = events.filter(e => e.event_type === 'cafe_impression');
    const clickEvents = events.filter(e => e.event_type === 'cafe_view');
    const durationEvents = events.filter(e => e.event_type === 'cafe_view_duration');
    const directionsEvents = events.filter(e => e.event_type === 'directions_click');
    const outboundEvents = events.filter(e => e.event_type === 'outbound_click');
    const shareEvents = events.filter(e => e.event_type === 'cafe_share');
    const rouletteSpins = events.filter(e => e.event_type === 'roulette_spin');
    const rouletteAccepts = events.filter(e => e.event_type === 'roulette_accept');

    const uniqueSessions = new Set(clickEvents.map(e => e.session_id));
    const durations = durationEvents.map(e => e.event_data?.duration_seconds || 0);
    const bounceCount = durationEvents.filter(e => (e.event_data?.duration_seconds || 0) < 10).length;

    const langCounts: Record<string, number> = {};
    clickEvents.forEach(e => {
      const lang = e.browser_language?.slice(0, 2) || 'unknown';
      langCounts[lang] = (langCounts[lang] || 0) + 1;
    });

    const deviceCounts: Record<string, number> = {};
    clickEvents.forEach(e => {
      const device = e.device_type || 'unknown';
      deviceCounts[device] = (deviceCounts[device] || 0) + 1;
    });

    stats.push({
      cafe_id: cafeId,
      month: monthDate,
      impressions: impressionEvents.length,
      clicks: clickEvents.length,
      directions_clicks: directionsEvents.length,
      outbound_clicks: outboundEvents.length,
      shares: shareEvents.length,
      avg_view_duration: durations.length > 0
        ? durations.reduce((a, b) => a + b, 0) / durations.length
        : 0,
      bounce_rate: durationEvents.length > 0
        ? bounceCount / durationEvents.length
        : 0,
      unique_visitors: uniqueSessions.size,
      visitor_languages: langCounts,
      visitor_devices: deviceCounts,
      roulette_appearances: rouletteSpins.length,
      roulette_accepts: rouletteAccepts.length,
    });
  }

  if (stats.length > 0) {
    const { error } = await supabase
      .from('cafe_monthly_stats')
      .upsert(stats, { onConflict: 'cafe_id,month' });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
  }

  return new Response(
    JSON.stringify({ message: `Aggregated stats for ${stats.length} cafes`, month: monthDate }),
    { status: 200 }
  );
});
