'use client';

import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Pause, Play, Trash2 } from 'lucide-react';

interface AnalyticsEvent {
  id: string;
  event_type: string;
  event_data: Record<string, unknown>;
  page_path: string | null;
  session_id: string;
  user_id: string | null;
  browser_language: string | null;
  device_type: string | null;
  district: string | null;
  created_at: string;
}

const EVENT_COLORS: Record<string, string> = {
  // Navigation
  page_view: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  cafe_view: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
  cafe_view_duration: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
  // Search
  search_text: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  filter_apply: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  search_no_results: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  station_select: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  // Map
  marker_click: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  map_viewport: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  // Funnel
  cafe_impression: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  directions_click: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
  cta_click: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
  outbound_click: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
  cafe_share: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
  // Engagement
  favorite_toggle: 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200',
  rating_submit: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  photo_view: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
  photo_swipe_depth: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
  // Roulette
  roulette_spin: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  roulette_accept: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  roulette_respin: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  // Auth
  signup: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
  login: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
};

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function formatEventData(data: Record<string, unknown>): string {
  if (!data || Object.keys(data).length === 0) return '';
  const parts: string[] = [];
  for (const [key, value] of Object.entries(data)) {
    if (value === null || value === undefined) continue;
    if (Array.isArray(value)) {
      parts.push(`${key}: [${value.length}]`);
    } else if (typeof value === 'object') {
      parts.push(`${key}: {...}`);
    } else {
      parts.push(`${key}: ${value}`);
    }
  }
  return parts.join(' · ');
}

export default function AdminAnalyticsPage() {
  const [events, setEvents] = useState<AnalyticsEvent[]>([]);
  const [paused, setPaused] = useState(false);
  const [filter, setFilter] = useState<string | null>(null);
  const [stats, setStats] = useState({ total: 0, sessions: new Set<string>() });
  const pausedRef = useRef(paused);
  const eventsRef = useRef(events);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Keep refs in sync
  useEffect(() => { pausedRef.current = paused; }, [paused]);
  useEffect(() => { eventsRef.current = events; }, [events]);

  // Load recent events + subscribe to realtime
  useEffect(() => {
    const supabase = createClient();

    // Load last 50 events
    supabase
      .from('analytics_events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data }) => {
        if (data) {
          const reversed = data.reverse();
          setEvents(reversed);
          setStats({
            total: reversed.length,
            sessions: new Set(reversed.map((e) => e.session_id)),
          });
        }
      });

    // Subscribe to new inserts
    const channel = supabase
      .channel('analytics-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'analytics_events' },
        (payload) => {
          if (pausedRef.current) return;
          const newEvent = payload.new as AnalyticsEvent;
          setEvents((prev) => {
            const updated = [...prev, newEvent].slice(-200); // keep last 200
            return updated;
          });
          setStats((prev) => ({
            total: prev.total + 1,
            sessions: new Set([...prev.sessions, newEvent.session_id]),
          }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Auto-scroll to bottom when new events arrive
  useEffect(() => {
    if (!paused) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [events, paused]);

  const filteredEvents = filter
    ? events.filter((e) => e.event_type === filter)
    : events;

  const eventTypes = [...new Set(events.map((e) => e.event_type))].sort();

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Live Analytics</h2>
          <p className="text-sm text-muted-foreground">
            {stats.total} events · {stats.sessions.size} sessions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPaused((p) => !p)}
            className="min-h-[44px]"
          >
            {paused ? <Play className="mr-1.5 h-4 w-4" /> : <Pause className="mr-1.5 h-4 w-4" />}
            {paused ? 'Resume' : 'Pause'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setEvents([]);
              setStats({ total: 0, sessions: new Set() });
            }}
            className="min-h-[44px]"
          >
            <Trash2 className="mr-1.5 h-4 w-4" />
            Clear
          </Button>
        </div>
      </div>

      {/* Filter badges */}
      <div className="flex flex-wrap gap-1.5">
        <Badge
          variant={filter === null ? 'default' : 'outline'}
          className="cursor-pointer min-h-[32px]"
          onClick={() => setFilter(null)}
        >
          All ({events.length})
        </Badge>
        {eventTypes.map((type) => (
          <Badge
            key={type}
            variant={filter === type ? 'default' : 'outline'}
            className={`cursor-pointer min-h-[32px] ${filter !== type ? EVENT_COLORS[type] || '' : ''}`}
            onClick={() => setFilter(filter === type ? null : type)}
          >
            {type} ({events.filter((e) => e.event_type === type).length})
          </Badge>
        ))}
      </div>

      {/* Event feed */}
      <div className="rounded-lg border bg-card max-h-[65vh] overflow-y-auto">
        {filteredEvents.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            {paused ? 'Paused — no new events' : 'Waiting for events...'}
          </div>
        ) : (
          <div className="divide-y">
            {filteredEvents.map((event) => (
              <div
                key={event.id}
                className="flex flex-col gap-1 px-4 py-2.5 text-sm hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-muted-foreground font-mono w-[70px] shrink-0">
                    {formatTime(event.created_at)}
                  </span>
                  <Badge
                    variant="secondary"
                    className={`text-xs ${EVENT_COLORS[event.event_type] || ''}`}
                  >
                    {event.event_type}
                  </Badge>
                  {event.page_path && (
                    <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                      {event.page_path}
                    </span>
                  )}
                  <div className="ml-auto flex items-center gap-2">
                    {event.device_type && (
                      <span className="text-xs text-muted-foreground">
                        {event.device_type}
                      </span>
                    )}
                    {event.district && (
                      <span className="text-xs text-muted-foreground">
                        {event.district}
                      </span>
                    )}
                    {event.user_id ? (
                      <Badge variant="outline" className="text-[10px]">user</Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] opacity-50">anon</Badge>
                    )}
                  </div>
                </div>
                {event.event_data && Object.keys(event.event_data).length > 0 && (
                  <span className="text-xs text-muted-foreground pl-[78px] truncate">
                    {formatEventData(event.event_data)}
                  </span>
                )}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </div>
    </div>
  );
}
