-- ============================================
-- Add photo_urls to cafe_submissions
-- Requires 1-3 photos when submitting a cafe
-- ============================================

ALTER TABLE public.cafe_submissions
ADD COLUMN IF NOT EXISTS photo_urls TEXT[] DEFAULT '{}';

COMMENT ON COLUMN public.cafe_submissions.photo_urls IS 'Storage paths for submitted photos (1-3 required)';
