-- RPC function to check if a naver_place_id already exists in cafes or cafe_submissions
CREATE OR REPLACE FUNCTION check_naver_place_id_exists(p_naver_place_id TEXT)
RETURNS TABLE(found_in TEXT, status TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check in published cafes
  RETURN QUERY
    SELECT 'cafes'::TEXT AS found_in, c.status::TEXT
    FROM cafes c
    WHERE c.naver_place_id = p_naver_place_id
    LIMIT 1;

  -- Check in pending/approved submissions
  RETURN QUERY
    SELECT 'submissions'::TEXT AS found_in, cs.status::TEXT
    FROM cafe_submissions cs
    WHERE cs.naver_place_id = p_naver_place_id
      AND cs.status IN ('pending', 'approved')
    LIMIT 1;
END;
$$;

-- Grant access to authenticated and anonymous users
GRANT EXECUTE ON FUNCTION check_naver_place_id_exists(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION check_naver_place_id_exists(TEXT) TO anon;
