-- ============================================
-- MULTILINGUAL SUPPORT (en, ko, fr, zh, vi)
-- ============================================

-- Update profiles preferred_language check
ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_preferred_language_check;

ALTER TABLE public.profiles
ALTER COLUMN preferred_language SET DEFAULT 'en';

ALTER TABLE public.profiles
ADD CONSTRAINT profiles_preferred_language_check
CHECK (preferred_language IN ('en', 'ko', 'fr', 'zh', 'vi'));

-- ============================================
-- DISTRICTS - Convert to JSONB translations
-- ============================================

ALTER TABLE public.districts
ADD COLUMN name JSONB;

UPDATE public.districts
SET name = jsonb_build_object('ko', name_ko, 'en', name_en);

ALTER TABLE public.districts
DROP COLUMN name_ko,
DROP COLUMN name_en;

ALTER TABLE public.districts
ALTER COLUMN name SET NOT NULL,
ALTER COLUMN name SET DEFAULT '{}'::JSONB;

-- ============================================
-- NEIGHBORHOODS - Convert to JSONB translations
-- ============================================

ALTER TABLE public.neighborhoods
ADD COLUMN name JSONB;

UPDATE public.neighborhoods
SET name = jsonb_build_object('ko', name_ko, 'en', name_en);

ALTER TABLE public.neighborhoods
DROP COLUMN name_ko,
DROP COLUMN name_en;

ALTER TABLE public.neighborhoods
ALTER COLUMN name SET NOT NULL,
ALTER COLUMN name SET DEFAULT '{}'::JSONB;

-- ============================================
-- CAFES - Convert to JSONB translations
-- ============================================

-- Name
ALTER TABLE public.cafes ADD COLUMN name JSONB;
UPDATE public.cafes SET name = jsonb_build_object('ko', name_ko, 'en', name_en);
ALTER TABLE public.cafes DROP COLUMN name_ko, DROP COLUMN name_en;
ALTER TABLE public.cafes ALTER COLUMN name SET NOT NULL, ALTER COLUMN name SET DEFAULT '{}'::JSONB;

-- Description
ALTER TABLE public.cafes ADD COLUMN description JSONB;
UPDATE public.cafes SET description = jsonb_build_object('ko', description_ko, 'en', description_en);
ALTER TABLE public.cafes DROP COLUMN description_ko, DROP COLUMN description_en;
ALTER TABLE public.cafes ALTER COLUMN description SET DEFAULT '{}'::JSONB;

-- Address
ALTER TABLE public.cafes ADD COLUMN address JSONB;
UPDATE public.cafes SET address = jsonb_build_object('ko', address_ko, 'en', address_en);
ALTER TABLE public.cafes DROP COLUMN address_ko, DROP COLUMN address_en;
ALTER TABLE public.cafes ALTER COLUMN address SET NOT NULL, ALTER COLUMN address SET DEFAULT '{}'::JSONB;

-- ============================================
-- CAFE_IMAGES - Convert to JSONB translations
-- ============================================

ALTER TABLE public.cafe_images ADD COLUMN alt_text JSONB;
UPDATE public.cafe_images SET alt_text = jsonb_build_object('ko', alt_text_ko, 'en', alt_text_en);
ALTER TABLE public.cafe_images DROP COLUMN alt_text_ko, DROP COLUMN alt_text_en;
ALTER TABLE public.cafe_images ALTER COLUMN alt_text SET DEFAULT '{}'::JSONB;

-- ============================================
-- HELPER FUNCTION: Get translated text
-- ============================================

CREATE OR REPLACE FUNCTION get_translation(
    translations JSONB,
    lang VARCHAR DEFAULT 'en',
    fallback_lang VARCHAR DEFAULT 'en'
)
RETURNS TEXT AS $$
BEGIN
    -- Try requested language first
    IF translations ? lang AND translations->>lang IS NOT NULL AND translations->>lang != '' THEN
        RETURN translations->>lang;
    END IF;

    -- Try fallback language
    IF translations ? fallback_lang AND translations->>fallback_lang IS NOT NULL AND translations->>fallback_lang != '' THEN
        RETURN translations->>fallback_lang;
    END IF;

    -- Return first available translation
    RETURN (SELECT value FROM jsonb_each_text(translations) WHERE value IS NOT NULL AND value != '' LIMIT 1);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================
-- UPDATE find_cafes_nearby to use new schema
-- ============================================

DROP FUNCTION IF EXISTS find_cafes_nearby(DECIMAL, DECIMAL, INTEGER);

CREATE OR REPLACE FUNCTION find_cafes_nearby(
    lat DECIMAL,
    lng DECIMAL,
    radius_meters INTEGER DEFAULT 1000,
    lang VARCHAR DEFAULT 'en'
)
RETURNS TABLE (
    id UUID,
    name TEXT,
    distance_meters DOUBLE PRECISION
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        c.id,
        get_translation(c.name, lang, 'en') as name,
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

-- ============================================
-- SUPPORTED LANGUAGES TABLE (for reference)
-- ============================================

CREATE TABLE public.supported_languages (
    code VARCHAR(5) PRIMARY KEY,
    name_native VARCHAR(50) NOT NULL,
    name_en VARCHAR(50) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0
);

INSERT INTO public.supported_languages (code, name_native, name_en, sort_order) VALUES
    ('en', 'English', 'English', 1),
    ('ko', '한국어', 'Korean', 2),
    ('fr', 'Français', 'French', 3),
    ('zh', '中文', 'Chinese', 4),
    ('vi', 'Tiếng Việt', 'Vietnamese', 5);
