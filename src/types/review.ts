import type { RatingBreakdown, TranslatedText } from './cafe';

export interface Review {
  id: string;
  cafeId: string;
  userId: string;

  // Ratings (1-5 scale, null if not rated)
  ratingFood: number | null;
  ratingDrinks: number | null;
  ratingTemperature: number | null;
  ratingSeating: number | null;
  ratingAmbiance: number | null;
  ratingWifi: number | null;
  ratingNoise: number | null;
  ratingOutlets: number | null;
  ratingValue: number | null;
  ratingOverall: number;

  // Content
  title: string | null;
  content: string | null;
  visitDate: string | null;
  visitPurpose: VisitPurpose | null;

  // Engagement
  helpfulCount: number;

  // Status
  status: ReviewStatus;

  // Metadata
  createdAt: string;
  updatedAt: string;

  // Joined data
  user?: ReviewUser;
  cafe?: ReviewCafe;
  userVote?: boolean | null; // true = helpful, false = not helpful, null = no vote
}

export interface ReviewUser {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  isVerified: boolean;
  totalReviews: number;
}

export interface ReviewCafe {
  id: string;
  name: TranslatedText;
  slug: string;
}

export type VisitPurpose = 'work' | 'date' | 'friends' | 'solo' | 'meeting';

export type ReviewStatus = 'active' | 'flagged' | 'hidden' | 'deleted';

export interface CreateReviewInput {
  cafeId: string;
  ratings: Partial<{
    food: 1 | 2 | 3 | 4 | 5;
    drinks: 1 | 2 | 3 | 4 | 5;
    temperature: 1 | 2 | 3 | 4 | 5;
    seating: 1 | 2 | 3 | 4 | 5;
    ambiance: 1 | 2 | 3 | 4 | 5;
    wifi: 1 | 2 | 3 | 4 | 5;
    noise: 1 | 2 | 3 | 4 | 5;
    outlets: 1 | 2 | 3 | 4 | 5;
    value: 1 | 2 | 3 | 4 | 5;
  }>;
  title?: string;
  content?: string;
  visitDate?: string;
  visitPurpose?: VisitPurpose;
}

export interface UpdateReviewInput {
  ratings?: Partial<{
    food: 1 | 2 | 3 | 4 | 5 | null;
    drinks: 1 | 2 | 3 | 4 | 5 | null;
    temperature: 1 | 2 | 3 | 4 | 5 | null;
    seating: 1 | 2 | 3 | 4 | 5 | null;
    ambiance: 1 | 2 | 3 | 4 | 5 | null;
    wifi: 1 | 2 | 3 | 4 | 5 | null;
    noise: 1 | 2 | 3 | 4 | 5 | null;
    outlets: 1 | 2 | 3 | 4 | 5 | null;
    value: 1 | 2 | 3 | 4 | 5 | null;
  }>;
  title?: string | null;
  content?: string | null;
  visitDate?: string | null;
  visitPurpose?: VisitPurpose | null;
}

// Visit purpose labels for UI
export const VISIT_PURPOSE_LABELS: Record<VisitPurpose, { ko: string; en: string }> = {
  work: { ko: '업무/공부', en: 'Work/Study' },
  date: { ko: '데이트', en: 'Date' },
  friends: { ko: '친구와 함께', en: 'With Friends' },
  solo: { ko: '혼자', en: 'Solo' },
  meeting: { ko: '미팅', en: 'Meeting' },
};

// Helper to calculate overall rating from individual ratings
export function calculateOverallRating(ratings: Partial<RatingBreakdown>): number {
  const values = Object.values(ratings).filter((v): v is number => v !== null && v !== undefined);
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}
