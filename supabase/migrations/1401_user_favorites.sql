-- ============================================
-- USER FAVORITES SYSTEM
-- Phase 14: Favorites/Bookmarks for cafes
-- ============================================

-- ============================================
-- USER FAVORITES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.user_favorites (
    -- Primary key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- User reference (who favorited)
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Cafe reference (what was favorited)
    cafe_id UUID NOT NULL REFERENCES public.cafes(id) ON DELETE CASCADE,

    -- Timestamp
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Composite unique constraint: one favorite per user per cafe
    CONSTRAINT user_favorites_unique UNIQUE (user_id, cafe_id)
);

-- Table comments
COMMENT ON TABLE public.user_favorites IS 'User favorites/bookmarks for cafes';
COMMENT ON COLUMN public.user_favorites.user_id IS 'User who favorited the cafe';
COMMENT ON COLUMN public.user_favorites.cafe_id IS 'Cafe that was favorited';
COMMENT ON COLUMN public.user_favorites.created_at IS 'When the favorite was created';

-- ============================================
-- INDEXES
-- ============================================

-- Index for fetching user's favorites list
CREATE INDEX IF NOT EXISTS idx_user_favorites_user_id
ON public.user_favorites(user_id);

-- Index for checking if a cafe is favorited
CREATE INDEX IF NOT EXISTS idx_user_favorites_cafe_id
ON public.user_favorites(cafe_id);

-- Composite index for quick lookup by user + cafe (covered by unique constraint)
-- The unique constraint already creates an index, but we add ordering support
CREATE INDEX IF NOT EXISTS idx_user_favorites_user_created
ON public.user_favorites(user_id, created_at DESC);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Enable RLS on user_favorites table
ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES
-- ============================================

-- SELECT: Users can only view their own favorites
DROP POLICY IF EXISTS "Users can view own favorites" ON public.user_favorites;
CREATE POLICY "Users can view own favorites"
ON public.user_favorites FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- INSERT: Users can only insert their own favorites
DROP POLICY IF EXISTS "Users can insert own favorites" ON public.user_favorites;
CREATE POLICY "Users can insert own favorites"
ON public.user_favorites FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- DELETE: Users can only delete their own favorites
DROP POLICY IF EXISTS "Users can delete own favorites" ON public.user_favorites;
CREATE POLICY "Users can delete own favorites"
ON public.user_favorites FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
