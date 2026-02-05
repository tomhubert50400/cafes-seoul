-- ============================================
-- RPC FUNCTION: Create cafe from submission
-- Handles PostGIS geometry creation
-- ============================================

CREATE OR REPLACE FUNCTION public.create_cafe_from_submission(
    p_name JSONB,
    p_address JSONB,
    p_phone TEXT,
    p_latitude NUMERIC,
    p_longitude NUMERIC,
    p_district_id INTEGER,
    p_neighborhood_id INTEGER,
    p_slug TEXT
)
RETURNS UUID AS $$
DECLARE
    new_cafe_id UUID;
BEGIN
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
        status
    ) VALUES (
        p_name,
        p_address,
        p_phone,
        p_latitude,
        p_longitude,
        ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326),
        p_district_id,
        p_neighborhood_id,
        p_slug,
        'active'
    )
    RETURNING id INTO new_cafe_id;

    RETURN new_cafe_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.create_cafe_from_submission IS 'Creates a cafe record with proper PostGIS geometry from admin submission approval';
