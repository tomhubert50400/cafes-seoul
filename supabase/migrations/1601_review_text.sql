-- ============================================
-- REVIEW TEXT AND HELPFUL VOTES
-- Phase 16: Text reviews with helpful voting
-- ============================================

-- ============================================
-- EXTEND CAFE_RATINGS TABLE
-- ============================================

-- Add review text and edit timestamp columns
ALTER TABLE public.cafe_ratings
  ADD COLUMN IF NOT EXISTS review_text TEXT,
  ADD COLUMN IF NOT EXISTS review_edited_at TIMESTAMPTZ;

-- Add check constraint for 500 character limit
ALTER TABLE public.cafe_ratings
  ADD CONSTRAINT review_text_length CHECK (
    review_text IS NULL OR LENGTH(review_text) <= 500
  );

-- Partial index for queries on reviews with text
CREATE INDEX IF NOT EXISTS idx_cafe_ratings_with_text
  ON public.cafe_ratings(cafe_id, created_at DESC)
  WHERE review_text IS NOT NULL;

-- Column comments
COMMENT ON COLUMN public.cafe_ratings.review_text IS 'Optional text review (max 500 characters)';
COMMENT ON COLUMN public.cafe_ratings.review_edited_at IS 'When the review text was last edited (null if never edited)';

-- ============================================
-- TRIGGER: Update review_edited_at on text change
-- ============================================

CREATE OR REPLACE FUNCTION public.update_review_edited_at()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update if review_text changed (handles NULL transitions)
  IF (NEW.review_text IS DISTINCT FROM OLD.review_text) THEN
    NEW.review_edited_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.update_review_edited_at IS 'Updates review_edited_at timestamp when review_text changes';

DROP TRIGGER IF EXISTS trigger_review_edited_at ON public.cafe_ratings;
CREATE TRIGGER trigger_review_edited_at
  BEFORE UPDATE ON public.cafe_ratings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_review_edited_at();

COMMENT ON TRIGGER trigger_review_edited_at ON public.cafe_ratings IS 'Automatically update review_edited_at when review_text changes';

-- ============================================
-- REVIEW HELPFUL VOTES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.review_helpful_votes (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- User who voted
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Rating/review that was voted helpful
  rating_id UUID NOT NULL REFERENCES public.cafe_ratings(id) ON DELETE CASCADE,

  -- Timestamp
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- One vote per user per review
  CONSTRAINT review_helpful_votes_unique UNIQUE (user_id, rating_id)
);

-- Table comments
COMMENT ON TABLE public.review_helpful_votes IS 'User votes marking reviews as helpful';
COMMENT ON COLUMN public.review_helpful_votes.user_id IS 'User who marked the review as helpful';
COMMENT ON COLUMN public.review_helpful_votes.rating_id IS 'Rating/review that was marked helpful';
COMMENT ON COLUMN public.review_helpful_votes.created_at IS 'When the vote was created';

-- ============================================
-- INDEXES
-- ============================================

-- Index for checking if user voted
CREATE INDEX IF NOT EXISTS idx_helpful_votes_user_rating
  ON public.review_helpful_votes(user_id, rating_id);

-- Index for counting votes per review
CREATE INDEX IF NOT EXISTS idx_helpful_votes_rating
  ON public.review_helpful_votes(rating_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Enable RLS on review_helpful_votes table
ALTER TABLE public.review_helpful_votes ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES
-- ============================================

-- SELECT: Anyone can view helpful votes (for count display)
DROP POLICY IF EXISTS "Anyone can view helpful votes" ON public.review_helpful_votes;
CREATE POLICY "Anyone can view helpful votes"
  ON public.review_helpful_votes FOR SELECT
  USING (true);

-- INSERT: Logged-in users can insert their own votes
DROP POLICY IF EXISTS "Users can insert own helpful votes" ON public.review_helpful_votes;
CREATE POLICY "Users can insert own helpful votes"
  ON public.review_helpful_votes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- DELETE: Users can delete their own votes
DROP POLICY IF EXISTS "Users can delete own helpful votes" ON public.review_helpful_votes;
CREATE POLICY "Users can delete own helpful votes"
  ON public.review_helpful_votes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
