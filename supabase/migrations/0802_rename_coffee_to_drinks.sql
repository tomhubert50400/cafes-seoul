-- ============================================
-- RENAME COFFEE TO DRINKS
-- Rename rating columns from coffee to drinks
-- Handles case where columns may already exist
-- ============================================

-- Rename column in cafe_ratings table (if coffee still exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cafe_ratings' AND column_name = 'coffee'
    ) THEN
        ALTER TABLE public.cafe_ratings RENAME COLUMN coffee TO drinks;
    END IF;
END $$;

-- Rename column in cafes table (if rating_coffee still exists and rating_drinks doesn't)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cafes' AND column_name = 'rating_coffee'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cafes' AND column_name = 'rating_drinks'
    ) THEN
        ALTER TABLE public.cafes RENAME COLUMN rating_coffee TO rating_drinks;
    END IF;
END $$;

-- Update comments
COMMENT ON COLUMN public.cafe_ratings.drinks IS 'Drinks quality rating 0-5 (0 = not rated)';
COMMENT ON COLUMN public.cafes.rating_drinks IS 'Average drinks quality rating';

-- ============================================
-- UPDATE TRIGGER FUNCTION
-- ============================================

-- Recreate the function with updated column references
CREATE OR REPLACE FUNCTION public.update_cafe_rating_aggregates(p_cafe_id UUID)
RETURNS VOID AS $$
DECLARE
    v_total_ratings INTEGER;
    v_overall_avg NUMERIC;
BEGIN
    -- Count total ratings
    SELECT COUNT(*) INTO v_total_ratings
    FROM public.cafe_ratings
    WHERE cafe_id = p_cafe_id;
    
    -- Calculate overall average
    SELECT AVG(overall::NUMERIC) INTO v_overall_avg
    FROM public.cafe_ratings
    WHERE cafe_id = p_cafe_id;
    
    -- Update cafes table with aggregated data
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
        updated_at = NOW()
    WHERE id = p_cafe_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- UPDATE HELPER FUNCTION
-- ============================================

-- Update calculate_dimension_average to handle 'drinks' parameter
CREATE OR REPLACE FUNCTION public.calculate_dimension_average(p_cafe_id UUID, p_dimension TEXT)
RETURNS NUMERIC AS $$
DECLARE
    v_avg NUMERIC;
    v_column TEXT;
BEGIN
    -- Map dimension name to column name
    v_column := CASE p_dimension
        WHEN 'drinks' THEN 'drinks'
        WHEN 'wifi' THEN 'wifi'
        WHEN 'price_value' THEN 'price_value'
        WHEN 'quietness' THEN 'quietness'
        WHEN 'seating' THEN 'seating'
        WHEN 'comfort' THEN 'comfort'
        WHEN 'food' THEN 'food'
        WHEN 'lighting' THEN 'lighting'
        WHEN 'outlets' THEN 'outlets'
        ELSE p_dimension
    END;
    
    -- Calculate average excluding 0 values
    EXECUTE format('
        SELECT AVG(%I::NUMERIC)
        FROM public.cafe_ratings
        WHERE cafe_id = $1 AND %I > 0
    ', v_column, v_column)
    INTO v_avg
    USING p_cafe_id;
    
    RETURN COALESCE(v_avg, 0);
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- REFRESH ALL CAFE AGGREGATES
-- ============================================

-- Recalculate aggregates for all cafes with ratings
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT DISTINCT cafe_id FROM public.cafe_ratings
    LOOP
        PERFORM public.update_cafe_rating_aggregates(r.cafe_id);
    END LOOP;
END $$;
