-- Add naver_place_id column to cafe_submissions
ALTER TABLE public.cafe_submissions
ADD COLUMN IF NOT EXISTS naver_place_id TEXT;

-- Index for fast duplicate lookups on naver_place_id
CREATE INDEX IF NOT EXISTS idx_cafe_submissions_naver_place_id
  ON cafe_submissions (naver_place_id)
  WHERE naver_place_id IS NOT NULL;
