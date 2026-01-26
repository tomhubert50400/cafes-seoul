export interface User {
  id: string;
  email: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  preferredLanguage: 'ko' | 'en';
  isModerator: boolean;
  isVerified: boolean;
  totalReviews: number;
  totalHelpfulVotes: number;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  isVerified: boolean;
  totalReviews: number;
  totalHelpfulVotes: number;
  createdAt: string;
}

export interface Favorite {
  id: string;
  userId: string;
  cafeId: string;
  listName: string;
  notes: string | null;
  createdAt: string;
  cafe?: {
    id: string;
    nameKo: string;
    nameEn: string | null;
    slug: string;
    addressKo: string;
    overallRating: number;
    primaryImageUrl: string | null;
  };
}

export interface FavoriteList {
  name: string;
  count: number;
}

export interface UpdateProfileInput {
  username?: string;
  displayName?: string | null;
  bio?: string | null;
  preferredLanguage?: 'ko' | 'en';
}
