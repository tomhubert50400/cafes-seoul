import type { CafeSummary } from './cafe';

export interface ForYouCafe extends CafeSummary {
  photoUrls: string[]; // All approved photos, sorted by upvote_count desc
}
