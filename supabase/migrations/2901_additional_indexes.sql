-- ============================================
-- ADDITIONAL INDEXES FOR QUERY PERFORMANCE
-- ============================================

-- Price range filter (IN queries)
CREATE INDEX IF NOT EXISTS idx_cafes_price_range
ON public.cafes(price_range) WHERE status = 'active';

-- Total ratings sort (sort by review count)
CREATE INDEX IF NOT EXISTS idx_cafes_total_ratings
ON public.cafes(total_ratings DESC) WHERE status = 'active';

-- Composite: district + overall_rating (common filter+sort combo)
CREATE INDEX IF NOT EXISTS idx_cafes_district_rating
ON public.cafes(district_id, overall_rating DESC) WHERE status = 'active';

-- Created_at for "newest" sort
CREATE INDEX IF NOT EXISTS idx_cafes_created_at
ON public.cafes(created_at DESC) WHERE status = 'active';

-- Latitude/longitude for bounding box neighborhood queries
CREATE INDEX IF NOT EXISTS idx_cafes_lat_lng
ON public.cafes(latitude, longitude) WHERE status = 'active';
