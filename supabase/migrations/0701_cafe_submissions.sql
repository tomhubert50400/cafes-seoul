-- ============================================
-- CAFE SUBMISSIONS SYSTEM
-- Phase 7: User cafe submission workflow
-- ============================================

-- ============================================
-- ENUMS
-- ============================================

-- User role enum: 'user' (default), 'pro' (cafe owners), 'admin' (moderators)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('user', 'pro', 'admin');
    END IF;
END
$$;

-- Submission status enum
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'submission_status') THEN
        CREATE TYPE submission_status AS ENUM ('pending', 'approved', 'declined');
    END IF;
END
$$;

-- ============================================
-- PROFILES TABLE UPDATE (add role)
-- ============================================

-- Add role column to profiles table if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'role'
    ) THEN
        ALTER TABLE public.profiles 
        ADD COLUMN role user_role DEFAULT 'user' NOT NULL;
    END IF;
END
$$;

-- Add role_updated_at column if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'role_updated_at'
    ) THEN
        ALTER TABLE public.profiles 
        ADD COLUMN role_updated_at TIMESTAMPTZ DEFAULT NULL;
    END IF;
END
$$;

COMMENT ON COLUMN public.profiles.role IS 'User role: user (default), pro (cafe owners), admin (moderators)';
COMMENT ON COLUMN public.profiles.role_updated_at IS 'Timestamp when role was last updated';

-- ============================================
-- CAFE SUBMISSIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.cafe_submissions (
    -- Primary key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Submitter reference
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Basic cafe info (translated names in JSONB format matching cafes table)
    name JSONB NOT NULL,
    
    -- Address (translated addresses in JSONB format)
    address JSONB NOT NULL,
    
    -- Optional contact info
    phone TEXT,
    
    -- Optional geolocation
    latitude NUMERIC(10, 8),
    longitude NUMERIC(11, 8),
    
    -- Location references
    district_id INTEGER REFERENCES public.districts(id),
    neighborhood_id INTEGER REFERENCES public.neighborhoods(id),
    
    -- Submission state
    status submission_status NOT NULL DEFAULT 'pending',
    
    -- Admin feedback
    rejection_reason TEXT,
    admin_notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Approval tracking
    approved_at TIMESTAMPTZ,
    approved_by UUID REFERENCES auth.users(id),
    
    -- Link to approved cafe (populated when approved)
    cafe_id UUID REFERENCES public.cafes(id)
);

-- Table comments
COMMENT ON TABLE public.cafe_submissions IS 'User-submitted cafes awaiting admin approval';
COMMENT ON COLUMN public.cafe_submissions.name IS 'Cafe name in multiple languages (JSONB: {en, ko, fr, zh, vi})';
COMMENT ON COLUMN public.cafe_submissions.address IS 'Cafe address in multiple languages (JSONB: {en, ko, fr, zh, vi})';
COMMENT ON COLUMN public.cafe_submissions.phone IS 'Optional phone number';
COMMENT ON COLUMN public.cafe_submissions.latitude IS 'Optional latitude for geolocation';
COMMENT ON COLUMN public.cafe_submissions.longitude IS 'Optional longitude for geolocation';
COMMENT ON COLUMN public.cafe_submissions.status IS 'Submission state: pending, approved, or declined';
COMMENT ON COLUMN public.cafe_submissions.rejection_reason IS 'Reason for declining (shown to user)';
COMMENT ON COLUMN public.cafe_submissions.admin_notes IS 'Internal admin notes (not shown to user)';
COMMENT ON COLUMN public.cafe_submissions.approved_at IS 'Timestamp when approved by admin';
COMMENT ON COLUMN public.cafe_submissions.approved_by IS 'Admin user who approved this submission';
COMMENT ON COLUMN public.cafe_submissions.cafe_id IS 'Reference to created cafe record (populated on approval)';

-- ============================================
-- SUBMISSION RATE LIMITS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.submission_rate_limits (
    -- Primary key - one record per user
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Daily submission count
    submission_count INTEGER NOT NULL DEFAULT 0,
    
    -- When the daily limit resets (midnight in user's timezone or UTC)
    reset_at TIMESTAMPTZ NOT NULL,
    
    -- Last submission timestamp
    last_submission_at TIMESTAMPTZ
);

COMMENT ON TABLE public.submission_rate_limits IS 'Tracks daily cafe submission limits per user (3 per day)';
COMMENT ON COLUMN public.submission_rate_limits.submission_count IS 'Number of submissions today (resets at reset_at)';
COMMENT ON COLUMN public.submission_rate_limits.reset_at IS 'Timestamp when daily limit resets';
COMMENT ON COLUMN public.submission_rate_limits.last_submission_at IS 'Timestamp of most recent submission';

-- ============================================
-- INDEXES
-- ============================================

-- Index for user's submissions list (profile page)
CREATE INDEX IF NOT EXISTS idx_cafe_submissions_user_status 
ON public.cafe_submissions(user_id, status);

-- Index for admin moderation queue
CREATE INDEX IF NOT EXISTS idx_cafe_submissions_status_created 
ON public.cafe_submissions(status, created_at);

-- Index for recent submissions
CREATE INDEX IF NOT EXISTS idx_cafe_submissions_created_at 
ON public.cafe_submissions(created_at DESC);

-- Index for finding submissions by approved cafe
CREATE INDEX IF NOT EXISTS idx_cafe_submissions_cafe_id 
ON public.cafe_submissions(cafe_id) 
WHERE cafe_id IS NOT NULL;

-- ============================================
-- TRIGGERS
-- ============================================

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for cafe_submissions updated_at
DROP TRIGGER IF EXISTS trigger_cafe_submissions_updated_at ON public.cafe_submissions;
CREATE TRIGGER trigger_cafe_submissions_updated_at
    BEFORE UPDATE ON public.cafe_submissions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Enable RLS on new tables
ALTER TABLE public.cafe_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submission_rate_limits ENABLE ROW LEVEL SECURITY;

-- ============================================
-- CAFE SUBMISSIONS POLICIES
-- ============================================

-- Users can view their own submissions
DROP POLICY IF EXISTS "Users can view own submissions" ON public.cafe_submissions;
CREATE POLICY "Users can view own submissions"
ON public.cafe_submissions FOR SELECT
USING (auth.uid() = user_id);

-- Admins can view all submissions
DROP POLICY IF EXISTS "Admins can view all submissions" ON public.cafe_submissions;
CREATE POLICY "Admins can view all submissions"
ON public.cafe_submissions FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Authenticated users can create submissions
DROP POLICY IF EXISTS "Authenticated users can create submissions" ON public.cafe_submissions;
CREATE POLICY "Authenticated users can create submissions"
ON public.cafe_submissions FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Users can update their own pending submissions
DROP POLICY IF EXISTS "Users can update own pending submissions" ON public.cafe_submissions;
CREATE POLICY "Users can update own pending submissions"
ON public.cafe_submissions FOR UPDATE
USING (auth.uid() = user_id AND status = 'pending')
WITH CHECK (auth.uid() = user_id AND status = 'pending');

-- Admins can update any submission (for approval/rejection)
DROP POLICY IF EXISTS "Admins can update any submission" ON public.cafe_submissions;
CREATE POLICY "Admins can update any submission"
ON public.cafe_submissions FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Users can delete their own pending submissions
DROP POLICY IF EXISTS "Users can delete own pending submissions" ON public.cafe_submissions;
CREATE POLICY "Users can delete own pending submissions"
ON public.cafe_submissions FOR DELETE
USING (auth.uid() = user_id AND status = 'pending');

-- ============================================
-- SUBMISSION RATE LIMITS POLICIES
-- ============================================

-- Users can view their own rate limit
DROP POLICY IF EXISTS "Users can view own rate limit" ON public.submission_rate_limits;
CREATE POLICY "Users can view own rate limit"
ON public.submission_rate_limits FOR SELECT
USING (auth.uid() = user_id);

-- Users can only update their own rate limit
DROP POLICY IF EXISTS "Users can update own rate limit" ON public.submission_rate_limits;
CREATE POLICY "Users can update own rate limit"
ON public.submission_rate_limits FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can modify own rate limit" ON public.submission_rate_limits;
CREATE POLICY "Users can modify own rate limit"
ON public.submission_rate_limits FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ============================================
-- HELPER FUNCTION: Check if user is admin
-- ============================================

CREATE OR REPLACE FUNCTION public.is_admin(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = user_uuid AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.is_admin IS 'Check if a user has admin role';

-- ============================================
-- HELPER FUNCTION: Get remaining submissions
-- ============================================

CREATE OR REPLACE FUNCTION public.get_remaining_submissions(user_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
    current_count INTEGER;
    limit_reset_at TIMESTAMPTZ;
BEGIN
    SELECT submission_count, reset_at
    INTO current_count, limit_reset_at
    FROM public.submission_rate_limits
    WHERE user_id = user_uuid;
    
    -- If no record exists or reset time has passed, reset counter
    IF current_count IS NULL OR limit_reset_at < NOW() THEN
        RETURN 3;
    END IF;
    
    RETURN GREATEST(0, 3 - current_count);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.get_remaining_submissions IS 'Get remaining daily submissions for a user (max 3 per day)';
