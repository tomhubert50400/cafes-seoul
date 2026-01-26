-- Enable PostGIS extension for geospatial queries
CREATE EXTENSION IF NOT EXISTS postgis;

-- ============================================
-- USERS & AUTHENTICATION
-- ============================================

-- Extends Supabase auth.users
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100),
    avatar_url TEXT,
    bio TEXT,
    preferred_language VARCHAR(10) DEFAULT 'ko', -- 'ko', 'en'
    is_moderator BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT FALSE,
    total_reviews INTEGER DEFAULT 0,
    total_helpful_votes INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- LOCATIONS & GEOGRAPHY
-- ============================================

CREATE TABLE public.districts (
    id SERIAL PRIMARY KEY,
    name_ko VARCHAR(50) NOT NULL,
    name_en VARCHAR(50) NOT NULL,
    slug VARCHAR(50) UNIQUE NOT NULL,
    bounds GEOMETRY(POLYGON, 4326),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.neighborhoods (
    id SERIAL PRIMARY KEY,
    district_id INTEGER REFERENCES public.districts(id),
    name_ko VARCHAR(50) NOT NULL,
    name_en VARCHAR(50) NOT NULL,
    slug VARCHAR(50) UNIQUE NOT NULL,
    bounds GEOMETRY(POLYGON, 4326),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CAFES
-- ============================================

CREATE TABLE public.cafes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Basic Info
    name_ko VARCHAR(200) NOT NULL,
    name_en VARCHAR(200),
    slug VARCHAR(200) UNIQUE NOT NULL,
    description_ko TEXT,
    description_en TEXT,

    -- Location
    address_ko VARCHAR(500) NOT NULL,
    address_en VARCHAR(500),
    district_id INTEGER REFERENCES public.districts(id),
    neighborhood_id INTEGER REFERENCES public.neighborhoods(id),
    location GEOMETRY(POINT, 4326) NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,

    -- Contact & Links
    phone VARCHAR(20),
    website TEXT,
    instagram_handle VARCHAR(100),
    naver_place_id VARCHAR(100),
    kakao_place_id VARCHAR(100),

    -- Operating Hours (JSONB for flexibility)
    operating_hours JSONB DEFAULT '{}'::JSONB,

    -- Features (boolean flags for filtering)
    has_wifi BOOLEAN DEFAULT FALSE,
    has_power_outlets BOOLEAN DEFAULT FALSE,
    has_parking BOOLEAN DEFAULT FALSE,
    is_pet_friendly BOOLEAN DEFAULT FALSE,
    has_outdoor_seating BOOLEAN DEFAULT FALSE,
    has_reservations BOOLEAN DEFAULT FALSE,
    is_laptop_friendly BOOLEAN DEFAULT FALSE,
    has_meeting_rooms BOOLEAN DEFAULT FALSE,

    -- Capacity & Seating
    seating_capacity INTEGER,
    seating_types TEXT[] DEFAULT '{}',

    -- Pricing
    price_range SMALLINT CHECK (price_range BETWEEN 1 AND 4),
    average_drink_price INTEGER,

    -- Categories & Tags
    cafe_type VARCHAR(50) DEFAULT 'other',
    specialties TEXT[] DEFAULT '{}',

    -- Aggregate Ratings (denormalized for performance)
    overall_rating DECIMAL(3, 2) DEFAULT 0,
    total_ratings INTEGER DEFAULT 0,
    rating_food DECIMAL(3, 2) DEFAULT 0,
    rating_drinks DECIMAL(3, 2) DEFAULT 0,
    rating_temperature DECIMAL(3, 2) DEFAULT 0,
    rating_seating DECIMAL(3, 2) DEFAULT 0,
    rating_ambiance DECIMAL(3, 2) DEFAULT 0,
    rating_wifi DECIMAL(3, 2) DEFAULT 0,
    rating_noise DECIMAL(3, 2) DEFAULT 0,
    rating_outlets DECIMAL(3, 2) DEFAULT 0,
    rating_value DECIMAL(3, 2) DEFAULT 0,

    -- Status & Moderation
    status VARCHAR(20) DEFAULT 'pending',
    verified_at TIMESTAMPTZ,
    verified_by UUID REFERENCES public.profiles(id),

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES public.profiles(id)
);

-- Indexes for performance
CREATE INDEX idx_cafes_location ON public.cafes USING GIST(location);
CREATE INDEX idx_cafes_district ON public.cafes(district_id);
CREATE INDEX idx_cafes_status ON public.cafes(status);
CREATE INDEX idx_cafes_overall_rating ON public.cafes(overall_rating DESC);
CREATE INDEX idx_cafes_slug ON public.cafes(slug);
CREATE INDEX idx_cafes_cafe_type ON public.cafes(cafe_type);

-- ============================================
-- CAFE IMAGES
-- ============================================

CREATE TABLE public.cafe_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cafe_id UUID REFERENCES public.cafes(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id),
    storage_path TEXT NOT NULL,
    thumbnail_path TEXT,
    alt_text_ko VARCHAR(200),
    alt_text_en VARCHAR(200),
    is_primary BOOLEAN DEFAULT FALSE,
    is_approved BOOLEAN DEFAULT FALSE,
    upload_source VARCHAR(20) DEFAULT 'user',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cafe_images_cafe ON public.cafe_images(cafe_id);

-- ============================================
-- RATINGS & REVIEWS
-- ============================================

CREATE TABLE public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cafe_id UUID REFERENCES public.cafes(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,

    -- Individual Ratings (1-5 scale, NULL if not rated)
    rating_food SMALLINT CHECK (rating_food BETWEEN 1 AND 5),
    rating_drinks SMALLINT CHECK (rating_drinks BETWEEN 1 AND 5),
    rating_temperature SMALLINT CHECK (rating_temperature BETWEEN 1 AND 5),
    rating_seating SMALLINT CHECK (rating_seating BETWEEN 1 AND 5),
    rating_ambiance SMALLINT CHECK (rating_ambiance BETWEEN 1 AND 5),
    rating_wifi SMALLINT CHECK (rating_wifi BETWEEN 1 AND 5),
    rating_noise SMALLINT CHECK (rating_noise BETWEEN 1 AND 5),
    rating_outlets SMALLINT CHECK (rating_outlets BETWEEN 1 AND 5),
    rating_value SMALLINT CHECK (rating_value BETWEEN 1 AND 5),

    -- Overall computed rating (stored for performance)
    rating_overall DECIMAL(3, 2) DEFAULT 0,

    -- Review Content
    title VARCHAR(200),
    content TEXT,
    visit_date DATE,
    visit_purpose VARCHAR(50),

    -- Engagement
    helpful_count INTEGER DEFAULT 0,

    -- Moderation
    status VARCHAR(20) DEFAULT 'active',

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- One review per user per cafe
    UNIQUE(cafe_id, user_id)
);

CREATE INDEX idx_reviews_cafe ON public.reviews(cafe_id);
CREATE INDEX idx_reviews_user ON public.reviews(user_id);
CREATE INDEX idx_reviews_created ON public.reviews(created_at DESC);
CREATE INDEX idx_reviews_status ON public.reviews(status);

-- ============================================
-- REVIEW HELPFUL VOTES
-- ============================================

CREATE TABLE public.review_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id UUID REFERENCES public.reviews(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    is_helpful BOOLEAN NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(review_id, user_id)
);

CREATE INDEX idx_review_votes_review ON public.review_votes(review_id);

-- ============================================
-- USER FAVORITES (BOOKMARKS)
-- ============================================

CREATE TABLE public.favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    cafe_id UUID REFERENCES public.cafes(id) ON DELETE CASCADE,
    list_name VARCHAR(100) DEFAULT 'default',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, cafe_id, list_name)
);

CREATE INDEX idx_favorites_user ON public.favorites(user_id);
CREATE INDEX idx_favorites_cafe ON public.favorites(cafe_id);

-- ============================================
-- CAFE REPORTS (MODERATION)
-- ============================================

CREATE TABLE public.reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID REFERENCES public.profiles(id),
    cafe_id UUID REFERENCES public.cafes(id),
    review_id UUID REFERENCES public.reviews(id),
    report_type VARCHAR(50) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    resolved_by UUID REFERENCES public.profiles(id),
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reports_status ON public.reports(status);

-- ============================================
-- DATABASE FUNCTIONS
-- ============================================

-- Function to calculate review overall rating
CREATE OR REPLACE FUNCTION calculate_review_overall_rating()
RETURNS TRIGGER AS $$
DECLARE
    total_sum DECIMAL;
    rating_count INTEGER;
BEGIN
    total_sum := 0;
    rating_count := 0;

    IF NEW.rating_food IS NOT NULL THEN
        total_sum := total_sum + NEW.rating_food;
        rating_count := rating_count + 1;
    END IF;
    IF NEW.rating_drinks IS NOT NULL THEN
        total_sum := total_sum + NEW.rating_drinks;
        rating_count := rating_count + 1;
    END IF;
    IF NEW.rating_temperature IS NOT NULL THEN
        total_sum := total_sum + NEW.rating_temperature;
        rating_count := rating_count + 1;
    END IF;
    IF NEW.rating_seating IS NOT NULL THEN
        total_sum := total_sum + NEW.rating_seating;
        rating_count := rating_count + 1;
    END IF;
    IF NEW.rating_ambiance IS NOT NULL THEN
        total_sum := total_sum + NEW.rating_ambiance;
        rating_count := rating_count + 1;
    END IF;
    IF NEW.rating_wifi IS NOT NULL THEN
        total_sum := total_sum + NEW.rating_wifi;
        rating_count := rating_count + 1;
    END IF;
    IF NEW.rating_noise IS NOT NULL THEN
        total_sum := total_sum + NEW.rating_noise;
        rating_count := rating_count + 1;
    END IF;
    IF NEW.rating_outlets IS NOT NULL THEN
        total_sum := total_sum + NEW.rating_outlets;
        rating_count := rating_count + 1;
    END IF;
    IF NEW.rating_value IS NOT NULL THEN
        total_sum := total_sum + NEW.rating_value;
        rating_count := rating_count + 1;
    END IF;

    IF rating_count > 0 THEN
        NEW.rating_overall := ROUND(total_sum / rating_count, 2);
    ELSE
        NEW.rating_overall := 0;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_review_overall
BEFORE INSERT OR UPDATE ON public.reviews
FOR EACH ROW EXECUTE FUNCTION calculate_review_overall_rating();

-- Function to update cafe aggregate ratings after review changes
CREATE OR REPLACE FUNCTION update_cafe_ratings()
RETURNS TRIGGER AS $$
DECLARE
    target_cafe_id UUID;
BEGIN
    target_cafe_id := COALESCE(NEW.cafe_id, OLD.cafe_id);

    UPDATE public.cafes
    SET
        total_ratings = (
            SELECT COUNT(*)
            FROM public.reviews
            WHERE cafe_id = target_cafe_id AND status = 'active'
        ),
        overall_rating = COALESCE((
            SELECT ROUND(AVG(rating_overall), 2)
            FROM public.reviews
            WHERE cafe_id = target_cafe_id AND status = 'active'
        ), 0),
        rating_food = COALESCE((
            SELECT ROUND(AVG(rating_food), 2)
            FROM public.reviews
            WHERE cafe_id = target_cafe_id AND status = 'active' AND rating_food IS NOT NULL
        ), 0),
        rating_drinks = COALESCE((
            SELECT ROUND(AVG(rating_drinks), 2)
            FROM public.reviews
            WHERE cafe_id = target_cafe_id AND status = 'active' AND rating_drinks IS NOT NULL
        ), 0),
        rating_temperature = COALESCE((
            SELECT ROUND(AVG(rating_temperature), 2)
            FROM public.reviews
            WHERE cafe_id = target_cafe_id AND status = 'active' AND rating_temperature IS NOT NULL
        ), 0),
        rating_seating = COALESCE((
            SELECT ROUND(AVG(rating_seating), 2)
            FROM public.reviews
            WHERE cafe_id = target_cafe_id AND status = 'active' AND rating_seating IS NOT NULL
        ), 0),
        rating_ambiance = COALESCE((
            SELECT ROUND(AVG(rating_ambiance), 2)
            FROM public.reviews
            WHERE cafe_id = target_cafe_id AND status = 'active' AND rating_ambiance IS NOT NULL
        ), 0),
        rating_wifi = COALESCE((
            SELECT ROUND(AVG(rating_wifi), 2)
            FROM public.reviews
            WHERE cafe_id = target_cafe_id AND status = 'active' AND rating_wifi IS NOT NULL
        ), 0),
        rating_noise = COALESCE((
            SELECT ROUND(AVG(rating_noise), 2)
            FROM public.reviews
            WHERE cafe_id = target_cafe_id AND status = 'active' AND rating_noise IS NOT NULL
        ), 0),
        rating_outlets = COALESCE((
            SELECT ROUND(AVG(rating_outlets), 2)
            FROM public.reviews
            WHERE cafe_id = target_cafe_id AND status = 'active' AND rating_outlets IS NOT NULL
        ), 0),
        rating_value = COALESCE((
            SELECT ROUND(AVG(rating_value), 2)
            FROM public.reviews
            WHERE cafe_id = target_cafe_id AND status = 'active' AND rating_value IS NOT NULL
        ), 0),
        updated_at = NOW()
    WHERE id = target_cafe_id;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_cafe_ratings
AFTER INSERT OR UPDATE OR DELETE ON public.reviews
FOR EACH ROW EXECUTE FUNCTION update_cafe_ratings();

-- Function to update helpful vote count
CREATE OR REPLACE FUNCTION update_review_helpful_count()
RETURNS TRIGGER AS $$
DECLARE
    target_review_id UUID;
BEGIN
    target_review_id := COALESCE(NEW.review_id, OLD.review_id);

    UPDATE public.reviews
    SET helpful_count = (
        SELECT COUNT(*)
        FROM public.review_votes
        WHERE review_id = target_review_id AND is_helpful = TRUE
    )
    WHERE id = target_review_id;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_helpful_count
AFTER INSERT OR UPDATE OR DELETE ON public.review_votes
FOR EACH ROW EXECUTE FUNCTION update_review_helpful_count();

-- Function to update user review count
CREATE OR REPLACE FUNCTION update_user_review_count()
RETURNS TRIGGER AS $$
DECLARE
    target_user_id UUID;
BEGIN
    target_user_id := COALESCE(NEW.user_id, OLD.user_id);

    UPDATE public.profiles
    SET total_reviews = (
        SELECT COUNT(*)
        FROM public.reviews
        WHERE user_id = target_user_id AND status = 'active'
    )
    WHERE id = target_user_id;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_review_count
AFTER INSERT OR UPDATE OR DELETE ON public.reviews
FOR EACH ROW EXECUTE FUNCTION update_user_review_count();

-- Function to find cafes within radius
CREATE OR REPLACE FUNCTION find_cafes_nearby(
    lat DECIMAL,
    lng DECIMAL,
    radius_meters INTEGER DEFAULT 1000
)
RETURNS TABLE (
    id UUID,
    name_ko VARCHAR,
    name_en VARCHAR,
    distance_meters DOUBLE PRECISION
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        c.id,
        c.name_ko,
        c.name_en,
        ST_Distance(
            c.location::geography,
            ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography
        ) as distance_meters
    FROM public.cafes c
    WHERE c.status = 'active'
    AND ST_DWithin(
        c.location::geography,
        ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography,
        radius_meters
    )
    ORDER BY distance_meters;
END;
$$ LANGUAGE plpgsql;

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, username, display_name, avatar_url)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION handle_new_user();
