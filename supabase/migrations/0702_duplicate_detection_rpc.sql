-- ============================================
-- DUPLICATE DETECTION RPC FUNCTION
-- Gap closure for find_duplicate_cafes RPC
-- Uses pg_trgm extension for fuzzy name matching
-- ============================================

-- Enable pg_trgm extension for similarity matching
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ============================================
-- GIN INDEX FOR PERFORMANCE
-- ============================================

-- Create GIN trigram index on cafe names for fast similarity search
CREATE INDEX IF NOT EXISTS idx_cafes_name_ko_trgm 
ON public.cafes USING GIN(name_ko gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_cafes_name_en_trgm 
ON public.cafes USING GIN(name_en gin_trgm_ops);

-- Create GIN trigram index on addresses
CREATE INDEX IF NOT EXISTS idx_cafes_address_ko_trgm 
ON public.cafes USING GIN(address_ko gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_cafes_address_en_trgm 
ON public.cafes USING GIN(address_en gin_trgm_ops);

-- ============================================
-- DUPLICATE DETECTION FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION public.find_duplicate_cafes(
    search_name TEXT,
    search_address TEXT,
    max_results INTEGER DEFAULT 5
)
RETURNS TABLE (
    id UUID,
    name JSONB,
    address JSONB,
    similarity_score REAL,
    match_type TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_name TEXT;
    v_address TEXT;
    v_max_results INTEGER;
BEGIN
    -- Handle null inputs
    v_name := COALESCE(search_name, '');
    v_address := COALESCE(search_address, '');
    v_max_results := COALESCE(max_results, 5);
    
    -- Return empty if no search criteria provided
    IF v_name = '' AND v_address = '' THEN
        RETURN;
    END IF;
    
    -- Search for potential duplicates using pg_trgm similarity
    -- Combines name similarity with optional address similarity
    RETURN QUERY
    SELECT 
        c.id,
        jsonb_build_object(
            'ko', c.name_ko,
            'en', c.name_en
        ) as name,
        jsonb_build_object(
            'ko', c.address_ko,
            'en', c.address_en
        ) as address,
        GREATEST(
            similarity(c.name_ko, v_name),
            similarity(c.name_en, v_name)
        )::REAL as similarity_score,
        CASE 
            WHEN v_address <> '' AND (
                similarity(c.address_ko, v_address) > 0.3 OR 
                similarity(c.address_en, v_address) > 0.3
            ) THEN 'name_address'::TEXT
            ELSE 'name'::TEXT
        END as match_type
    FROM public.cafes c
    WHERE c.status = 'active'
      AND (
          -- Name similarity threshold (0.3 = 30% similar)
          similarity(c.name_ko, v_name) > 0.3
          OR similarity(c.name_en, v_name) > 0.3
          -- Also check address if provided
          OR (
              v_address <> '' AND (
                  similarity(c.address_ko, v_address) > 0.4
                  OR similarity(c.address_en, v_address) > 0.4
              )
          )
      )
    ORDER BY 
        GREATEST(
            similarity(c.name_ko, v_name),
            similarity(c.name_en, v_name)
        ) DESC,
        c.name_ko
    LIMIT v_max_results;
END;
$$;

-- ============================================
-- FUNCTION COMMENT
-- ============================================

COMMENT ON FUNCTION public.find_duplicate_cafes IS 
'Find potential duplicate cafes using pg_trgm fuzzy matching.
Parameters:
  - search_name: Cafe name to search for (checks both ko and en)
  - search_address: Address to search for (optional)
  - max_results: Maximum number of results (default 5)
Returns cafes with similarity_score > 0.3 (30% similar)
Uses GIN trigram indexes for performance.';

-- ============================================
-- GRANTS
-- ============================================

-- Allow authenticated users to execute the function
GRANT EXECUTE ON FUNCTION public.find_duplicate_cafes(TEXT, TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.find_duplicate_cafes(TEXT, TEXT, INTEGER) TO anon;

-- ============================================
-- VERIFICATION QUERY (for documentation)
-- ============================================

/*
-- Test the function:
SELECT * FROM find_duplicate_cafes('Starbucks Gangnam', 'Gangnam-daero', 5);

-- Check similarity calculation:
SELECT 
    name_ko,
    name_en,
    similarity(name_ko, 'Starbucks') as ko_sim,
    similarity(name_en, 'Starbucks') as en_sim
FROM cafes 
WHERE status = 'active'
ORDER BY GREATEST(similarity(name_ko, 'Starbucks'), similarity(name_en, 'Starbucks')) DESC
LIMIT 5;
*/
