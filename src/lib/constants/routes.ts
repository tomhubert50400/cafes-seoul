// App routes
export const ROUTES = {
  HOME: '/',
  CAFES: '/cafes',
  CAFE_DETAIL: (slug: string) => `/cafes/${slug}`,
  MAP: '/map',
  DISTRICTS: '/districts',
  DISTRICT_DETAIL: (slug: string) => `/districts/${slug}`,

  // Auth
  LOGIN: '/login',
  SIGNUP: '/signup',

  // User
  PROFILE: '/profile',
  PROFILE_REVIEWS: '/profile/reviews',
  PROFILE_FAVORITES: '/profile/favorites',
  PROFILE_SUBMISSIONS: '/profile/submissions',
  PROFILE_SETTINGS: '/profile/settings',
  USER_PROFILE: (username: string) => `/users/${username}`,

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
  INSTAGRAM: (handle: string) => `https://instagram.com/${handle}`,
} as const;
