import type { TranslatedText } from './cafe';

export type SupportedLanguage = 'en' | 'ko' | 'fr' | 'zh' | 'vi';

/**
 * User role types for the system
 */
export type UserRole = 'user' | 'pro' | 'admin';

export interface User {
  id: string;
  email: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  preferredLanguage: string;
  isModerator: boolean;
  isVerified: boolean;
  role: UserRole;
  roleUpdatedAt: string | null;
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
  role: UserRole;
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
    name: TranslatedText;
    slug: string;
    address: TranslatedText;
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
  preferredLanguage?: SupportedLanguage;
}
