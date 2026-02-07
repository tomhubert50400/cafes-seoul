-- Add boolean feature indicators to cafe_ratings
-- Users can flag: wifi, power outlets, laptop-friendly, parking
-- (pet_friendly already exists)

ALTER TABLE public.cafe_ratings
  ADD COLUMN IF NOT EXISTS has_wifi BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS has_power_outlets BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS is_laptop_friendly BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS has_parking BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN public.cafe_ratings.has_wifi IS 'Whether the user marked cafe as having wifi';
COMMENT ON COLUMN public.cafe_ratings.has_power_outlets IS 'Whether the user marked cafe as having power outlets';
COMMENT ON COLUMN public.cafe_ratings.is_laptop_friendly IS 'Whether the user marked cafe as laptop-friendly';
COMMENT ON COLUMN public.cafe_ratings.has_parking IS 'Whether the user marked cafe as having parking';

-- Update the aggregate function to also aggregate boolean features
CREATE OR REPLACE FUNCTION public.update_cafe_rating_aggregates(p_cafe_id UUID)
RETURNS VOID AS $$
DECLARE
    v_total_ratings INTEGER;
    v_overall_avg NUMERIC;
    v_wifi_pct NUMERIC;
    v_outlets_pct NUMERIC;
    v_laptop_pct NUMERIC;
    v_pet_pct NUMERIC;
    v_parking_pct NUMERIC;
BEGIN
    -- Count total ratings
    SELECT COUNT(*) INTO v_total_ratings
    FROM public.cafe_ratings
    WHERE cafe_id = p_cafe_id;

    -- Calculate overall average
    SELECT AVG(overall::NUMERIC) INTO v_overall_avg
    FROM public.cafe_ratings
    WHERE cafe_id = p_cafe_id;

    -- Calculate boolean percentages (>= 50% = true)
    SELECT
        AVG(CASE WHEN has_wifi THEN 1.0 ELSE 0.0 END),
        AVG(CASE WHEN has_power_outlets THEN 1.0 ELSE 0.0 END),
        AVG(CASE WHEN is_laptop_friendly THEN 1.0 ELSE 0.0 END),
        AVG(CASE WHEN pet_friendly THEN 1.0 ELSE 0.0 END),
        AVG(CASE WHEN has_parking THEN 1.0 ELSE 0.0 END)
    INTO v_wifi_pct, v_outlets_pct, v_laptop_pct, v_pet_pct, v_parking_pct
    FROM public.cafe_ratings
    WHERE cafe_id = p_cafe_id;

    -- Update cafes table
    UPDATE public.cafes
    SET
        total_ratings = v_total_ratings,
        overall_rating = COALESCE(v_overall_avg, 0),
        rating_drinks = public.calculate_dimension_average(p_cafe_id, 'drinks'),
        rating_wifi = public.calculate_dimension_average(p_cafe_id, 'wifi'),
        rating_price_value = public.calculate_dimension_average(p_cafe_id, 'price_value'),
        rating_quietness = public.calculate_dimension_average(p_cafe_id, 'quietness'),
        rating_seating = public.calculate_dimension_average(p_cafe_id, 'seating'),
        rating_comfort = public.calculate_dimension_average(p_cafe_id, 'comfort'),
        rating_food = public.calculate_dimension_average(p_cafe_id, 'food'),
        rating_lighting = public.calculate_dimension_average(p_cafe_id, 'lighting'),
        rating_outlets = public.calculate_dimension_average(p_cafe_id, 'outlets'),
        -- Aggregate booleans: true if >= 50% of raters said yes
        has_wifi = CASE WHEN v_total_ratings > 0 AND v_wifi_pct >= 0.5 THEN TRUE ELSE has_wifi END,
        has_power_outlets = CASE WHEN v_total_ratings > 0 AND v_outlets_pct >= 0.5 THEN TRUE ELSE has_power_outlets END,
        is_laptop_friendly = CASE WHEN v_total_ratings > 0 AND v_laptop_pct >= 0.5 THEN TRUE ELSE is_laptop_friendly END,
        is_pet_friendly = CASE WHEN v_total_ratings > 0 AND v_pet_pct >= 0.5 THEN TRUE ELSE is_pet_friendly END,
        has_parking = CASE WHEN v_total_ratings > 0 AND v_parking_pct >= 0.5 THEN TRUE ELSE has_parking END,
        updated_at = NOW()
    WHERE id = p_cafe_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
