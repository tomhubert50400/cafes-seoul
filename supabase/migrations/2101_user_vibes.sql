-- ============================================
-- USER VIBES SYSTEM
-- Phase 21: Custom user vibes/filter presets
-- ============================================

-- ============================================
-- USER VIBES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.user_vibes (
    -- Primary key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- User reference
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Vibe details
    name VARCHAR(10) NOT NULL,
    icon VARCHAR(20) NOT NULL DEFAULT 'Sparkles',
    filters JSONB NOT NULL DEFAULT '{}',

    -- Ordering
    position SMALLINT NOT NULL DEFAULT 0,

    -- If non-null, this row overrides a built-in preset (e.g. 'work_study')
    default_preset_id VARCHAR(30),

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table comments
COMMENT ON TABLE public.user_vibes IS 'User custom vibes (filter presets) and overrides of built-in presets';
COMMENT ON COLUMN public.user_vibes.user_id IS 'User who created the vibe';
COMMENT ON COLUMN public.user_vibes.name IS 'Display name for the vibe (max 10 chars)';
COMMENT ON COLUMN public.user_vibes.icon IS 'Lucide icon name';
COMMENT ON COLUMN public.user_vibes.filters IS 'JSON object of filter key-value pairs';
COMMENT ON COLUMN public.user_vibes.position IS 'Display order';
COMMENT ON COLUMN public.user_vibes.default_preset_id IS 'Non-null means this overrides a built-in preset';

-- ============================================
-- INDEXES
-- ============================================

-- Index for fetching user's vibes list
CREATE INDEX IF NOT EXISTS idx_user_vibes_user_id
ON public.user_vibes(user_id);

-- Unique partial index: one override per default preset per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_vibes_user_default_preset
ON public.user_vibes(user_id, default_preset_id)
WHERE default_preset_id IS NOT NULL;

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.user_vibes ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES
-- ============================================

-- SELECT: Users can only view their own vibes
DROP POLICY IF EXISTS "Users can view own vibes" ON public.user_vibes;
CREATE POLICY "Users can view own vibes"
ON public.user_vibes FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- INSERT: Users can only insert their own vibes
DROP POLICY IF EXISTS "Users can insert own vibes" ON public.user_vibes;
CREATE POLICY "Users can insert own vibes"
ON public.user_vibes FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- UPDATE: Users can only update their own vibes
DROP POLICY IF EXISTS "Users can update own vibes" ON public.user_vibes;
CREATE POLICY "Users can update own vibes"
ON public.user_vibes FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- DELETE: Users can only delete their own vibes
DROP POLICY IF EXISTS "Users can delete own vibes" ON public.user_vibes;
CREATE POLICY "Users can delete own vibes"
ON public.user_vibes FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
