-- ============================================
-- GENERATED search_text COLUMN FOR FAST SEARCH
-- Replaces 10 ILIKE conditions with 1 indexed lookup
-- ============================================

-- Ensure pg_trgm is available (already enabled in 0702)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Add generated column that concatenates all name + address translations
ALTER TABLE public.cafes
ADD COLUMN IF NOT EXISTS search_text TEXT GENERATED ALWAYS AS (
  COALESCE(name->>'ko', '') || ' ' ||
  COALESCE(name->>'en', '') || ' ' ||
  COALESCE(name->>'fr', '') || ' ' ||
  COALESCE(name->>'zh', '') || ' ' ||
  COALESCE(name->>'vi', '') || ' ' ||
  COALESCE(address->>'ko', '') || ' ' ||
  COALESCE(address->>'en', '') || ' ' ||
  COALESCE(address->>'fr', '') || ' ' ||
  COALESCE(address->>'zh', '') || ' ' ||
  COALESCE(address->>'vi', '')
) STORED;

-- GIN trigram index for fast ILIKE on the generated column
CREATE INDEX IF NOT EXISTS idx_cafes_search_text_trgm
ON public.cafes USING GIN(search_text gin_trgm_ops);
