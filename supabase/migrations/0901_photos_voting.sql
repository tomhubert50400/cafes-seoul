-- ============================================
-- PHOTOS AND VOTING SYSTEM
-- Phase 9: Photo uploads with moderation and voting
-- ============================================

-- ============================================
-- ENUMS
-- ============================================

-- Photo status enum for moderation workflow
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'photo_status') THEN
        CREATE TYPE photo_status AS ENUM ('pending', 'approved', 'rejected');
    END IF;
END
$$;

COMMENT ON TYPE photo_status IS 'Photo moderation status: pending (awaiting approval), approved (visible), rejected (declined)';

-- ============================================
-- PHOTOS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.photos (
    -- Primary key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Uploader reference (privacy: never store uploader name, only user_id for admin reference)
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Cafe reference (photos belong to a specific cafe)
    cafe_id UUID NOT NULL REFERENCES public.cafes(id) ON DELETE CASCADE,
    
    -- Storage path in Supabase Storage (NOT full URL - construct URL in application layer)
    storage_path TEXT NOT NULL,
    
    -- Moderation status
    status photo_status NOT NULL DEFAULT 'pending',
    
    -- Admin feedback (shown to user if rejected)
    rejection_reason TEXT,
    
    -- Denormalized upvote count for sorting (updated via trigger)
    upvote_count INTEGER NOT NULL DEFAULT 0,
    
    -- File metadata for monitoring
    file_size INTEGER,
    mime_type TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Approval tracking
    approved_at TIMESTAMPTZ,
    approved_by UUID REFERENCES auth.users(id)
);

-- Table comments
COMMENT ON TABLE public.photos IS 'User-uploaded photos for cafes with moderation workflow';
COMMENT ON COLUMN public.photos.user_id IS 'Uploader user ID (links to auth.users for admin reference only, never displayed publicly)';
COMMENT ON COLUMN public.photos.cafe_id IS 'Cafe this photo belongs to';
COMMENT ON COLUMN public.photos.storage_path IS 'Path to photo in Supabase Storage bucket (e.g., "cafes/uuid/filename.jpg")';
COMMENT ON COLUMN public.photos.status IS 'Moderation status: pending (awaiting approval), approved (visible in gallery), rejected (declined)';
COMMENT ON COLUMN public.photos.rejection_reason IS 'Reason for rejection shown to uploader';
COMMENT ON COLUMN public.photos.upvote_count IS 'Cached count of upvotes (auto-updated via trigger)';
COMMENT ON COLUMN public.photos.file_size IS 'File size in bytes for monitoring';
COMMENT ON COLUMN public.photos.mime_type IS 'MIME type (e.g., image/jpeg, image/png)';
COMMENT ON COLUMN public.photos.created_at IS 'When photo was uploaded';
COMMENT ON COLUMN public.photos.updated_at IS 'When photo was last modified';
COMMENT ON COLUMN public.photos.approved_at IS 'Timestamp when approved by admin';
COMMENT ON COLUMN public.photos.approved_by IS 'Admin user who approved this photo';

-- ============================================
-- PHOTOS INDEXES
-- ============================================

-- Index for cafe's photos (gallery queries)
CREATE INDEX IF NOT EXISTS idx_photos_cafe_status 
ON public.photos(cafe_id, status);

-- Index for user's photos (dashboard)
CREATE INDEX IF NOT EXISTS idx_photos_user_id 
ON public.photos(user_id);

-- Index for admin moderation queue (pending photos)
CREATE INDEX IF NOT EXISTS idx_photos_status_created 
ON public.photos(status, created_at) 
WHERE status = 'pending';

-- Index for sorting by upvotes (gallery display order)
CREATE INDEX IF NOT EXISTS idx_photos_upvote_count 
ON public.photos(upvote_count DESC);

-- Index for recently uploaded photos
CREATE INDEX IF NOT EXISTS idx_photos_created_at 
ON public.photos(created_at DESC);

-- ============================================
-- PHOTO VOTES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.photo_votes (
    -- Primary key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Voter reference
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Photo being voted on
    photo_id UUID NOT NULL REFERENCES public.photos(id) ON DELETE CASCADE,
    
    -- When vote was cast
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enforce one vote per user per photo (toggle behavior)
CREATE UNIQUE INDEX IF NOT EXISTS idx_photo_votes_user_photo 
ON public.photo_votes(user_id, photo_id);

-- Table comments
COMMENT ON TABLE public.photo_votes IS 'User upvotes for photos - toggle voting (click to vote, click again to unvote)';
COMMENT ON COLUMN public.photo_votes.user_id IS 'User who cast the vote';
COMMENT ON COLUMN public.photo_votes.photo_id IS 'Photo being upvoted';
COMMENT ON INDEX idx_photo_votes_user_photo IS 'Enforces one vote per user per photo, enables toggle behavior';

-- ============================================
-- PHOTO VOTES INDEXES
-- ============================================

-- Index for user's voted photos (dashboard "photos you liked")
CREATE INDEX IF NOT EXISTS idx_photo_votes_user_id 
ON public.photo_votes(user_id);

-- Index for counting votes on a photo (fast upvote_count updates)
CREATE INDEX IF NOT EXISTS idx_photo_votes_photo_id 
ON public.photo_votes(photo_id);

-- Index for recent votes (analytics/moderation)
CREATE INDEX IF NOT EXISTS idx_photo_votes_created_at 
ON public.photo_votes(created_at DESC);

-- ============================================
-- PHOTO UPLOAD RATE LIMITS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.photo_upload_limits (
    -- Primary key - one record per user
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Daily upload count
    upload_count INTEGER NOT NULL DEFAULT 0,
    
    -- When the daily limit resets (midnight KST for Korea relevance)
    reset_at TIMESTAMPTZ NOT NULL,
    
    -- Last upload timestamp
    last_upload_at TIMESTAMPTZ
);

-- Table comments
COMMENT ON TABLE public.photo_upload_limits IS 'Tracks daily photo upload limits per user (10 per day)';
COMMENT ON COLUMN public.photo_upload_limits.upload_count IS 'Number of uploads today (resets at reset_at)';
COMMENT ON COLUMN public.photo_upload_limits.reset_at IS 'Timestamp when daily limit resets (midnight KST)';
COMMENT ON COLUMN public.photo_upload_limits.last_upload_at IS 'Timestamp of most recent upload';

-- ============================================
-- HELPER FUNCTION: Get remaining photo uploads
-- ============================================

CREATE OR REPLACE FUNCTION public.get_remaining_uploads(user_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
    current_count INTEGER;
    limit_reset_at TIMESTAMPTZ;
BEGIN
    SELECT upload_count, reset_at
    INTO current_count, limit_reset_at
    FROM public.photo_upload_limits
    WHERE user_id = user_uuid;
    
    -- If no record exists or reset time has passed, reset counter
    IF current_count IS NULL OR limit_reset_at < NOW() THEN
        RETURN 10;
    END IF;
    
    RETURN GREATEST(0, 10 - current_count);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.get_remaining_uploads IS 'Get remaining daily photo uploads for a user (max 10 per day)';

-- ============================================
-- HELPER FUNCTION: Check if user can upload photo
-- ============================================

CREATE OR REPLACE FUNCTION public.can_upload_photo(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN public.get_remaining_uploads(user_uuid) > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.can_upload_photo IS 'Returns TRUE if user has remaining daily upload quota';

-- ============================================
-- HELPER FUNCTION: Count user's photos for a cafe
-- ============================================

CREATE OR REPLACE FUNCTION public.count_user_cafe_photos(user_uuid UUID, cafe_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
    photo_count INTEGER;
BEGIN
    -- Count photos regardless of status (pending + approved, exclude rejected)
    -- Rejected photos don't count toward the limit (user can retry)
    SELECT COUNT(*) INTO photo_count
    FROM public.photos
    WHERE user_id = user_uuid 
      AND cafe_id = cafe_uuid
      AND status != 'rejected';
    
    RETURN photo_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.count_user_cafe_photos IS 'Count photos uploaded by user for a specific cafe (excludes rejected)';

-- ============================================
-- HELPER FUNCTION: Check if user can upload to cafe
-- ============================================

CREATE OR REPLACE FUNCTION public.can_upload_to_cafe(user_uuid UUID, cafe_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- User can upload if they have fewer than 3 photos for this cafe
    RETURN public.count_user_cafe_photos(user_uuid, cafe_uuid) < 3;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.can_upload_to_cafe IS 'Returns TRUE if user has fewer than 3 photos for this cafe';

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Enable RLS on photos table
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;

-- Enable RLS on photo_votes table
ALTER TABLE public.photo_votes ENABLE ROW LEVEL SECURITY;

-- Enable RLS on photo_upload_limits table
ALTER TABLE public.photo_upload_limits ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PHOTOS RLS POLICIES
-- ============================================

-- SELECT: Anyone can view APPROVED photos
DROP POLICY IF EXISTS "Anyone can view approved photos" ON public.photos;
CREATE POLICY "Anyone can view approved photos"
ON public.photos FOR SELECT
USING (status = 'approved');

-- SELECT: Users can view their OWN photos regardless of status
DROP POLICY IF EXISTS "Users can view own photos" ON public.photos;
CREATE POLICY "Users can view own photos"
ON public.photos FOR SELECT
USING (auth.uid() = user_id);

-- SELECT: Admins can view ALL photos
DROP POLICY IF EXISTS "Admins can view all photos" ON public.photos;
CREATE POLICY "Admins can view all photos"
ON public.photos FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- INSERT: Authenticated users can insert photos
DROP POLICY IF EXISTS "Authenticated users can insert photos" ON public.photos;
CREATE POLICY "Authenticated users can insert photos"
ON public.photos FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- UPDATE: Only admins can update status and rejection_reason
DROP POLICY IF EXISTS "Admins can update photo status" ON public.photos;
CREATE POLICY "Admins can update photo status"
ON public.photos FOR UPDATE
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

-- DELETE: Users can delete their OWN pending photos only
DROP POLICY IF EXISTS "Users can delete own pending photos" ON public.photos;
CREATE POLICY "Users can delete own pending photos"
ON public.photos FOR DELETE
USING (auth.uid() = user_id AND status = 'pending');

-- ============================================
-- PHOTO VOTES RLS POLICIES
-- ============================================

-- SELECT: Anyone can view votes (for count display)
DROP POLICY IF EXISTS "Anyone can view photo votes" ON public.photo_votes;
CREATE POLICY "Anyone can view photo votes"
ON public.photo_votes FOR SELECT
USING (true);

-- INSERT: Users can only vote for themselves
DROP POLICY IF EXISTS "Users can vote for themselves" ON public.photo_votes;
CREATE POLICY "Users can vote for themselves"
ON public.photo_votes FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- DELETE: Users can only delete their own votes
DROP POLICY IF EXISTS "Users can delete own votes" ON public.photo_votes;
CREATE POLICY "Users can delete own votes"
ON public.photo_votes FOR DELETE
USING (auth.uid() = user_id);

-- ============================================
-- PHOTO UPLOAD LIMITS RLS POLICIES
-- ============================================

-- Users can view their own rate limit
DROP POLICY IF EXISTS "Users can view own upload limit" ON public.photo_upload_limits;
CREATE POLICY "Users can view own upload limit"
ON public.photo_upload_limits FOR SELECT
USING (auth.uid() = user_id);

-- Users can only insert/update their own rate limit
DROP POLICY IF EXISTS "Users can manage own upload limit" ON public.photo_upload_limits;
CREATE POLICY "Users can manage own upload limit"
ON public.photo_upload_limits FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own upload limit" ON public.photo_upload_limits;
CREATE POLICY "Users can update own upload limit"
ON public.photo_upload_limits FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ============================================
-- TRIGGERS
-- ============================================

-- Function to auto-update photos.updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_photo_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for photos updated_at
DROP TRIGGER IF EXISTS trigger_photos_updated_at ON public.photos;
CREATE TRIGGER trigger_photos_updated_at
    BEFORE UPDATE ON public.photos
    FOR EACH ROW
    EXECUTE FUNCTION public.update_photo_updated_at();

-- ============================================
-- TRIGGER: Auto-update upvote_count on vote changes
-- ============================================

CREATE OR REPLACE FUNCTION public.update_photo_upvote_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Increment count when vote is added
        UPDATE public.photos
        SET upvote_count = upvote_count + 1
        WHERE id = NEW.photo_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        -- Decrement count when vote is removed
        UPDATE public.photos
        SET upvote_count = upvote_count - 1
        WHERE id = OLD.photo_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply trigger to photo_votes
DROP TRIGGER IF EXISTS trigger_photo_votes_update_count ON public.photo_votes;
CREATE TRIGGER trigger_photo_votes_update_count
    AFTER INSERT OR DELETE ON public.photo_votes
    FOR EACH ROW
    EXECUTE FUNCTION public.update_photo_upvote_count();

COMMENT ON TRIGGER trigger_photo_votes_update_count ON public.photo_votes IS 'Automatically recalculate photo upvote count when votes are added or removed';

