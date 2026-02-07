// App routes
export const ROUTES = {
  HOME: '/',
  CAFES: '/cafes',
  CAFE_DETAIL: (slug: string) => `/cafes/${slug}`,
  MAP: '/map',
  ROULETTE: '/roulette',
  DISTRICTS: '/districts',
  DISTRICT_DETAIL: (slug: string) => `/districts/${slug}`,

  // Auth
  LOGIN: '/login',
  SIGNUP: '/signup',

  // Admin
  ADMIN: '/admin',

  // User
  PROFILE: '/profile',
  DASHBOARD: '/dashboard',
  PROFILE_REVIEWS: '/profile/reviews',
  PROFILE_FAVORITES: '/profile/favorites',
  PROFILE_SUBMISSIONS: '/profile/submissions',
  PROFILE_SETTINGS: '/profile/settings',
  USER_PROFILE: (id: string) => `/user/${id}`,

  // API
  API: {
    CAFES: '/api/cafes',
    CAFE: (id: string) => `/api/cafes/${id}`,
    CAFE_REVIEWS: (id: string) => `/api/cafes/${id}/reviews`,
    CAFES_NEARBY: '/api/cafes/nearby',
    CAFES_SEARCH: '/api/cafes/search',
    REVIEWS: '/api/reviews',
    REVIEW: (id: string) => `/api/reviews/${id}`,
    DISTRICTS: '/api/districts',
    USER_FAVORITES: '/api/users/me/favorites',
  },
} as const;

// External URLs
export const EXTERNAL_URLS = {
  KAKAO_MAP: 'https://map.kakao.com',
  NAVER_MAP: 'https://map.naver.com',
  GOOGLE_MAPS: 'https://www.google.com/maps',
  INSTAGRAM: (handle: string) => `https://instagram.com/${handle}`,
} as const;
