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

