export type ConsentChoices = {
  essential: true;
  analytics: boolean;
  location: boolean;
};

export type DeviceType = 'mobile' | 'desktop' | 'tablet';

export type EventType =
  | 'page_view'
  | 'cafe_view'
  | 'cafe_view_duration'
  | 'search_text'
  | 'filter_apply'
  | 'search_no_results'
  | 'station_select'
  | 'marker_click'
  | 'map_viewport'
  | 'cafe_impression'
  | 'directions_click'
  | 'cta_click'
  | 'outbound_click'
  | 'cafe_share'
  | 'favorite_toggle'
  | 'rating_submit'
  | 'photo_view'
  | 'photo_swipe_depth'
  | 'cafe_compare_session'
  | 'repeat_view'
  | 'roulette_spin'
  | 'roulette_accept'
  | 'roulette_respin'
  | 'signup'
  | 'login';

export interface TrackEventPayload {
  eventType: EventType;
  eventData?: Record<string, unknown>;
  pagePath?: string;
  referrerPage?: string;
  latitude?: number;
  longitude?: number;
  district?: string;
  browserLanguage?: string;
  deviceType?: DeviceType;
  sessionId: string;
}
