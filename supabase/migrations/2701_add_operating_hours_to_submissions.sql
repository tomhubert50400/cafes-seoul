-- ============================================
-- ADD OPERATING HOURS TO CAFE SUBMISSIONS
-- Allows users to submit operating hours with cafe submissions
-- ============================================

-- Add operating_hours column to cafe_submissions
ALTER TABLE public.cafe_submissions
ADD COLUMN IF NOT EXISTS operating_hours JSONB DEFAULT '{}'::JSONB;

-- Update the RPC function to accept operating_hours
CREATE OR REPLACE FUNCTION public.create_cafe_from_submission(
    p_name JSONB,
    p_address JSONB,
    p_phone TEXT,
    p_latitude NUMERIC,
    p_longitude NUMERIC,
    p_district_id INTEGER,
    p_neighborhood_id INTEGER,
    p_slug TEXT,
    p_kakao_place_id TEXT DEFAULT NULL,
    p_operating_hours JSONB DEFAULT '{}'::JSONB
)
RETURNS UUID AS $$
DECLARE
    new_cafe_id UUID;
    v_location GEOMETRY;
BEGIN
    -- Only create geometry if both coordinates are provided
    IF p_latitude IS NOT NULL AND p_longitude IS NOT NULL THEN
        v_location := ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326);
    ELSE
        v_location := NULL;
    END IF;

    INSERT INTO public.cafes (
        name,
        address,
        phone,
        latitude,
        longitude,
        location,
        district_id,
        neighborhood_id,
        slug,
        status,
        kakao_place_id,
        operating_hours
    ) VALUES (
        p_name,
        p_address,
        p_phone,
        p_latitude,
        p_longitude,
        v_location,
        p_district_id,
        p_neighborhood_id,
        p_slug,
        'active',
        p_kakao_place_id,
        p_operating_hours
    )
    RETURNING id INTO new_cafe_id;

    RETURN new_cafe_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.create_cafe_from_submission IS 'Creates a cafe record with proper PostGIS geometry and operating hours from admin submission approval';
