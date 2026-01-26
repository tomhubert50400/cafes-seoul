-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.districts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.neighborhoods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cafes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cafe_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PROFILES POLICIES
-- ============================================

-- Anyone can view profiles
CREATE POLICY "Profiles are viewable by everyone"
ON public.profiles FOR SELECT
USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- ============================================
-- DISTRICTS & NEIGHBORHOODS POLICIES
-- ============================================

-- Anyone can view districts and neighborhoods
CREATE POLICY "Districts are viewable by everyone"
ON public.districts FOR SELECT
USING (true);

CREATE POLICY "Neighborhoods are viewable by everyone"
ON public.neighborhoods FOR SELECT
USING (true);

-- ============================================
-- CAFES POLICIES
-- ============================================

-- Anyone can view active cafes
CREATE POLICY "Active cafes are viewable by everyone"
ON public.cafes FOR SELECT
USING (status = 'active');

-- Cafe creators can view their own pending cafes
CREATE POLICY "Creators can view own pending cafes"
ON public.cafes FOR SELECT
USING (auth.uid() = created_by AND status = 'pending');

-- Authenticated users can create cafes
CREATE POLICY "Authenticated users can create cafes"
ON public.cafes FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Cafe creators can update their own cafes (before verification)
CREATE POLICY "Creators can update own unverified cafes"
ON public.cafes FOR UPDATE
USING (auth.uid() = created_by AND verified_at IS NULL)
WITH CHECK (auth.uid() = created_by AND verified_at IS NULL);

-- ============================================
-- CAFE IMAGES POLICIES
-- ============================================

-- Anyone can view approved images
CREATE POLICY "Approved cafe images are viewable by everyone"
ON public.cafe_images FOR SELECT
USING (is_approved = true);

-- Users can view their own pending images
CREATE POLICY "Users can view own pending images"
ON public.cafe_images FOR SELECT
USING (auth.uid() = user_id AND is_approved = false);

-- Authenticated users can upload images
CREATE POLICY "Authenticated users can upload images"
ON public.cafe_images FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Users can delete their own images
CREATE POLICY "Users can delete own images"
ON public.cafe_images FOR DELETE
USING (auth.uid() = user_id);

-- ============================================
-- REVIEWS POLICIES
-- ============================================

-- Anyone can view active reviews
CREATE POLICY "Active reviews are viewable by everyone"
ON public.reviews FOR SELECT
USING (status = 'active');

-- Users can view their own hidden/flagged reviews
CREATE POLICY "Users can view own reviews"
ON public.reviews FOR SELECT
USING (auth.uid() = user_id);

-- Authenticated users can create reviews
CREATE POLICY "Authenticated users can create reviews"
ON public.reviews FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Users can update their own reviews
CREATE POLICY "Users can update own reviews"
ON public.reviews FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own reviews
CREATE POLICY "Users can delete own reviews"
ON public.reviews FOR DELETE
USING (auth.uid() = user_id);

-- ============================================
-- REVIEW VOTES POLICIES
-- ============================================

-- Anyone can view vote counts (aggregated in reviews table)
CREATE POLICY "Review votes are viewable by everyone"
ON public.review_votes FOR SELECT
USING (true);

-- Authenticated users can vote
CREATE POLICY "Authenticated users can vote"
ON public.review_votes FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Users can update their own votes
CREATE POLICY "Users can update own votes"
ON public.review_votes FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own votes
CREATE POLICY "Users can delete own votes"
ON public.review_votes FOR DELETE
USING (auth.uid() = user_id);

-- ============================================
-- FAVORITES POLICIES
-- ============================================

-- Users can only view their own favorites
CREATE POLICY "Users can view own favorites"
ON public.favorites FOR SELECT
USING (auth.uid() = user_id);

-- Authenticated users can create favorites
CREATE POLICY "Authenticated users can create favorites"
ON public.favorites FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own favorites
CREATE POLICY "Users can delete own favorites"
ON public.favorites FOR DELETE
USING (auth.uid() = user_id);

-- ============================================
-- REPORTS POLICIES
-- ============================================

-- Users can view their own reports
CREATE POLICY "Users can view own reports"
ON public.reports FOR SELECT
USING (auth.uid() = reporter_id);

-- Authenticated users can create reports
CREATE POLICY "Authenticated users can create reports"
ON public.reports FOR INSERT
WITH CHECK (auth.role() = 'authenticated');
