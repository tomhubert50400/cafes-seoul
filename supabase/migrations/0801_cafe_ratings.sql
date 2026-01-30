-- ============================================
-- CAFE RATINGS SYSTEM
-- Phase 8: User ratings with 10 dimensions
-- ============================================

-- ============================================
-- CAFE RATINGS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.cafe_ratings (
    -- Primary key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- User reference (who made the rating)
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Cafe reference (what is being rated)
    cafe_id UUID NOT NULL REFERENCES public.cafes(id) ON DELETE CASCADE,
    
    -- Mandatory dimension: Overall rating (1-5, cannot be 0)
    overall INTEGER NOT NULL CHECK (overall >= 1 AND overall <= 5),
    
    -- Optional dimensions: 0 means "not rated", 1-5 are valid ratings
    coffee INTEGER CHECK (coffee >= 0 AND coffee <= 5) DEFAULT 0,
    wifi INTEGER CHECK (wifi >= 0 AND wifi <= 5) DEFAULT 0,
    price_value INTEGER CHECK (price_value >= 0 AND price_value <= 5) DEFAULT 0,
    quietness INTEGER CHECK (quietness >= 0 AND quietness <= 5) DEFAULT 0,
    seating INTEGER CHECK (seating >= 0 AND seating <= 5) DEFAULT 0,
    comfort INTEGER CHECK (comfort >= 0 AND comfort <= 5) DEFAULT 0,
    food INTEGER CHECK (food >= 0 AND food <= 5) DEFAULT 0,
    lighting INTEGER CHECK (lighting >= 0 AND lighting <= 5) DEFAULT 0,
    outlets INTEGER CHECK (outlets >= 0 AND outlets <= 5) DEFAULT 0,
    
    -- Pet friendly indicator (separate from ratings)
    pet_friendly BOOLEAN DEFAULT FALSE,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table comments
COMMENT ON TABLE public.cafe_ratings IS 'User ratings for cafes on 10 dimensions (1 mandatory, 9 optional)';
COMMENT ON COLUMN public.cafe_ratings.user_id IS 'User who submitted the rating';
COMMENT ON COLUMN public.cafe_ratings.cafe_id IS 'Cafe being rated';
COMMENT ON COLUMN public.cafe_ratings.overall IS 'Mandatory overall rating 1-5';
COMMENT ON COLUMN public.cafe_ratings.coffee IS 'Coffee quality rating 0-5 (0 = not rated)';
COMMENT ON COLUMN public.cafe_ratings.wifi IS 'Wi-Fi quality rating 0-5 (0 = not rated)';
COMMENT ON COLUMN public.cafe_ratings.price_value IS 'Price/value rating 0-5 (0 = not rated)';
COMMENT ON COLUMN public.cafe_ratings.quietness IS 'Quietness rating 0-5 (0 = not rated)';
COMMENT ON COLUMN public.cafe_ratings.seating IS 'Seating comfort/availability rating 0-5 (0 = not rated)';
COMMENT ON COLUMN public.cafe_ratings.comfort IS 'General comfort rating 0-5 (0 = not rated)';
COMMENT ON COLUMN public.cafe_ratings.food IS 'Food quality rating 0-5 (0 = not rated)';
COMMENT ON COLUMN public.cafe_ratings.lighting IS 'Lighting/ambiance rating 0-5 (0 = not rated)';
COMMENT ON COLUMN public.cafe_ratings.outlets IS 'Power outlet availability rating 0-5 (0 = not rated)';
COMMENT ON COLUMN public.cafe_ratings.pet_friendly IS 'Whether the user marked cafe as pet-friendly';
COMMENT ON COLUMN public.cafe_ratings.created_at IS 'When the rating was first submitted';
COMMENT ON COLUMN public.cafe_ratings.updated_at IS 'When the rating was last updated';

-- ============================================
-- UNIQUE CONSTRAINT: One rating per user per cafe
-- ============================================

-- Enable upsert support via ON CONFLICT
CREATE UNIQUE INDEX IF NOT EXISTS idx_cafe_ratings_user_cafe 
ON public.cafe_ratings(user_id, cafe_id);

COMMENT ON INDEX idx_cafe_ratings_user_cafe IS 'Enforces one rating per user per cafe, enables upsert operations';

-- ============================================
-- INDEXES
-- ============================================

-- Index for aggregating ratings by cafe (for average calculations)
CREATE INDEX IF NOT EXISTS idx_cafe_ratings_cafe_id 
ON public.cafe_ratings(cafe_id);

-- Index for user's ratings list (profile page)
CREATE INDEX IF NOT EXISTS idx_cafe_ratings_user_id 
ON public.cafe_ratings(user_id);

-- Composite index for filtering by cafe and overall rating
CREATE INDEX IF NOT EXISTS idx_cafe_ratings_cafe_overall 
ON public.cafe_ratings(cafe_id, overall);

-- Index for recently updated ratings (for moderation/analytics)
CREATE INDEX IF NOT EXISTS idx_cafe_ratings_updated_at 
ON public.cafe_ratings(updated_at DESC);

-- ============================================
-- TRIGGERS
-- ============================================

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_cafe_rating_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for cafe_ratings updated_at
DROP TRIGGER IF EXISTS trigger_cafe_ratings_updated_at ON public.cafe_ratings;
CREATE TRIGGER trigger_cafe_ratings_updated_at
    BEFORE UPDATE ON public.cafe_ratings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_cafe_rating_updated_at();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Enable RLS on cafe_ratings table
ALTER TABLE public.cafe_ratings ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES
-- ============================================

-- SELECT: All authenticated users can read all ratings
-- (Ratings are public information)
DROP POLICY IF EXISTS "Anyone can view cafe ratings" ON public.cafe_ratings;
CREATE POLICY "Anyone can view cafe ratings"
ON public.cafe_ratings FOR SELECT
USING (true);

-- INSERT: Authenticated users can only insert their own ratings
DROP POLICY IF EXISTS "Users can create own ratings" ON public.cafe_ratings;
CREATE POLICY "Users can create own ratings"
ON public.cafe_ratings FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- UPDATE: Users can only update their own ratings
DROP POLICY IF EXISTS "Users can update own ratings" ON public.cafe_ratings;
CREATE POLICY "Users can update own ratings"
ON public.cafe_ratings FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- DELETE: Users can only delete their own ratings
DROP POLICY IF EXISTS "Users can delete own ratings" ON public.cafe_ratings;
CREATE POLICY "Users can delete own ratings"
ON public.cafe_ratings FOR DELETE
USING (auth.uid() = user_id);

-- ============================================
-- HELPER FUNCTION: Upsert cafe rating
-- ============================================

CREATE OR REPLACE FUNCTION public.upsert_cafe_rating(
    p_user_id UUID,
    p_cafe_id UUID,
    p_overall INTEGER,
    p_coffee INTEGER DEFAULT 0,
    p_wifi INTEGER DEFAULT 0,
    p_price_value INTEGER DEFAULT 0,
    p_quietness INTEGER DEFAULT 0,
    p_seating INTEGER DEFAULT 0,
    p_comfort INTEGER DEFAULT 0,
    p_food INTEGER DEFAULT 0,
    p_lighting INTEGER DEFAULT 0,
    p_outlets INTEGER DEFAULT 0,
    p_pet_friendly BOOLEAN DEFAULT FALSE
)
RETURNS UUID AS $$
DECLARE
    v_rating_id UUID;
BEGIN
    -- Insert or update the rating
    INSERT INTO public.cafe_ratings (
        user_id,
        cafe_id,
        overall,
        coffee,
        wifi,
        price_value,
        quietness,
        seating,
        comfort,
        food,
        lighting,
        outlets,
        pet_friendly,
        created_at,
        updated_at
    ) VALUES (
        p_user_id,
        p_cafe_id,
        p_overall,
        p_coffee,
        p_wifi,
        p_price_value,
        p_quietness,
        p_seating,
        p_comfort,
        p_food,
        p_lighting,
        p_outlets,
        p_pet_friendly,
        NOW(),
        NOW()
    )
    ON CONFLICT (user_id, cafe_id)
    DO UPDATE SET
        overall = EXCLUDED.overall,
        coffee = EXCLUDED.coffee,
        wifi = EXCLUDED.wifi,
        price_value = EXCLUDED.price_value,
        quietness = EXCLUDED.quietness,
        seating = EXCLUDED.seating,
        comfort = EXCLUDED.comfort,
        food = EXCLUDED.food,
        lighting = EXCLUDED.lighting,
        outlets = EXCLUDED.outlets,
        pet_friendly = EXCLUDED.pet_friendly,
        updated_at = NOW()
    RETURNING id INTO v_rating_id;
    
    RETURN v_rating_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.upsert_cafe_rating IS 'Insert or update a user rating for a cafe. Handles the unique constraint on (user_id, cafe_id) for upsert behavior.';

-- ============================================
-- HELPER FUNCTION: Calculate dimension average (excluding 0s)
-- ============================================

CREATE OR REPLACE FUNCTION public.calculate_dimension_average(
    p_cafe_id UUID,
    p_dimension TEXT
)
RETURNS NUMERIC AS $$
DECLARE
    v_avg NUMERIC;
    v_valid_query TEXT;
BEGIN
    -- Build dynamic query to exclude 0 values
    v_valid_query := format(
        'SELECT AVG(%I::NUMERIC) 
         FROM public.cafe_ratings 
         WHERE cafe_id = $1 AND %I > 0',
        p_dimension, p_dimension
    );
    
    EXECUTE v_valid_query INTO v_avg USING p_cafe_id;
    
    RETURN COALESCE(v_avg, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.calculate_dimension_average IS 'Calculate average rating for a dimension, excluding 0 values (not rated). Returns 0 if no valid ratings.';

-- ============================================
-- HELPER FUNCTION: Update cafe aggregated ratings
-- ============================================

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
    
    -- Calculate overall average (never null, at least 1-5)
    SELECT AVG(overall::NUMERIC) INTO v_overall_avg
    FROM public.cafe_ratings
    WHERE cafe_id = p_cafe_id;
    
    -- Update cafes table with aggregated data
    UPDATE public.cafes
    SET 
        total_ratings = v_total_ratings,
        overall_rating = COALESCE(v_overall_avg, 0),
        -- Update individual dimension averages (excluding 0s)
        rating_coffee = public.calculate_dimension_average(p_cafe_id, 'coffee'),
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

COMMENT ON FUNCTION public.update_cafe_rating_aggregates IS 'Recalculate and update all aggregated ratings for a cafe. Call after rating insert/update/delete.';

-- ============================================
-- TRIGGER: Auto-update cafe aggregates on rating change
-- ============================================

CREATE OR REPLACE FUNCTION public.trigger_update_cafe_aggregates()
RETURNS TRIGGER AS $$
BEGIN
    -- Update aggregates for the affected cafe
    IF TG_OP = 'DELETE' THEN
        PERFORM public.update_cafe_rating_aggregates(OLD.cafe_id);
        RETURN OLD;
    ELSE
        PERFORM public.update_cafe_rating_aggregates(NEW.cafe_id);
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to cafe_ratings
DROP TRIGGER IF EXISTS trigger_cafe_ratings_update_aggregates ON public.cafe_ratings;
CREATE TRIGGER trigger_cafe_ratings_update_aggregates
    AFTER INSERT OR UPDATE OR DELETE ON public.cafe_ratings
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_update_cafe_aggregates();

COMMENT ON TRIGGER trigger_cafe_ratings_update_aggregates ON public.cafe_ratings IS 'Automatically recalculate cafe rating aggregates when ratings change';
