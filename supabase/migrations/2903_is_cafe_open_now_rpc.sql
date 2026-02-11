-- ============================================
-- is_cafe_open_now() SQL FUNCTION
-- Ports JS isCafeOpenNow logic to PostgreSQL
-- Enables DB-level filtering for "open now"
-- ============================================

CREATE OR REPLACE FUNCTION public.is_cafe_open_now(hours JSONB)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  kst_now TIMESTAMPTZ;
  day_key TEXT;
  day_hours JSONB;
  current_minutes INTEGER;
  open_parts TEXT[];
  close_parts TEXT[];
  open_minutes INTEGER;
  close_minutes INTEGER;
  bs_parts TEXT[];
  be_parts TEXT[];
  break_start INTEGER;
  break_end INTEGER;
BEGIN
  -- No hours data = closed
  IF hours IS NULL OR hours = '{}'::JSONB THEN
    RETURN FALSE;
  END IF;

  -- Current time in KST
  kst_now := NOW() AT TIME ZONE 'Asia/Seoul';

  -- Map day of week to key
  day_key := CASE EXTRACT(DOW FROM kst_now)
    WHEN 0 THEN 'sun'
    WHEN 1 THEN 'mon'
    WHEN 2 THEN 'tue'
    WHEN 3 THEN 'wed'
    WHEN 4 THEN 'thu'
    WHEN 5 THEN 'fri'
    WHEN 6 THEN 'sat'
  END;

  -- Get today's hours
  day_hours := hours->day_key;
  IF day_hours IS NULL OR day_hours->>'open' IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Current time as minutes since midnight
  current_minutes := EXTRACT(HOUR FROM kst_now)::INTEGER * 60
                   + EXTRACT(MINUTE FROM kst_now)::INTEGER;

  -- Parse open time
  open_parts := string_to_array(day_hours->>'open', ':');
  open_minutes := open_parts[1]::INTEGER * 60 + open_parts[2]::INTEGER;

  -- Parse close time (24:00 = 1440)
  close_parts := string_to_array(day_hours->>'close', ':');
  close_minutes := CASE
    WHEN close_parts[1]::INTEGER = 24 THEN 1440
    ELSE close_parts[1]::INTEGER * 60 + close_parts[2]::INTEGER
  END;

  -- Parse break times if present
  IF day_hours->>'breakStart' IS NOT NULL AND day_hours->>'breakEnd' IS NOT NULL THEN
    bs_parts := string_to_array(day_hours->>'breakStart', ':');
    be_parts := string_to_array(day_hours->>'breakEnd', ':');
    break_start := bs_parts[1]::INTEGER * 60 + bs_parts[2]::INTEGER;
    break_end := be_parts[1]::INTEGER * 60 + be_parts[2]::INTEGER;
  ELSE
    break_start := -1;
    break_end := -1;
  END IF;

  -- Overnight hours (e.g., 22:00 - 02:00)
  IF close_minutes <= open_minutes THEN
    IF current_minutes >= open_minutes OR current_minutes < close_minutes THEN
      -- Check break
      IF break_start >= 0 AND current_minutes >= break_start AND current_minutes < break_end THEN
        RETURN FALSE;
      END IF;
      RETURN TRUE;
    END IF;
    RETURN FALSE;
  END IF;

  -- Normal hours (e.g., 09:00 - 22:00)
  IF current_minutes >= open_minutes AND current_minutes < close_minutes THEN
    -- Check break
    IF break_start >= 0 AND current_minutes >= break_start AND current_minutes < break_end THEN
      RETURN FALSE;
    END IF;
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$;

-- ============================================
-- RPC: Get IDs of currently open cafes
-- Called before main query when openNow filter is active
-- ============================================

CREATE OR REPLACE FUNCTION public.get_open_cafe_ids()
RETURNS SETOF UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT id
  FROM public.cafes
  WHERE status = 'active'
    AND is_cafe_open_now(operating_hours) = TRUE;
$$;

-- ============================================
-- GRANTS
-- ============================================

GRANT EXECUTE ON FUNCTION public.is_cafe_open_now(JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_cafe_open_now(JSONB) TO anon;
GRANT EXECUTE ON FUNCTION public.get_open_cafe_ids() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_open_cafe_ids() TO anon;
