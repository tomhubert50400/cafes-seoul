-- Add operating_hours column to cafe_submissions
-- This was missing from the original migration (0701_cafe_submissions.sql)
ALTER TABLE public.cafe_submissions
ADD COLUMN IF NOT EXISTS operating_hours JSONB DEFAULT '{}'::jsonb;
