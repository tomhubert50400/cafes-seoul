-- Add proper UNIQUE constraint on kakao_place_id for upsert support
-- The existing partial unique index doesn't work with Supabase upsert

-- First, drop the partial index
DROP INDEX IF EXISTS idx_cafes_kakao_place_id;

-- Add a proper UNIQUE constraint
ALTER TABLE public.cafes
ADD CONSTRAINT cafes_kakao_place_id_unique UNIQUE (kakao_place_id);
