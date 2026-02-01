-- Migration: Profile Settings Support
-- Phase 15-01: Add columns for account deletion and privacy, create avatars storage bucket
--
-- This migration adds:
-- 1. scheduled_deletion_at column for soft delete with 7-day grace period
-- 2. is_private column for privacy toggle
-- 3. avatars storage bucket with RLS policies for user-scoped access
-- 4. Index for efficient cleanup queries

-- ============================================
-- PROFILE TABLE ADDITIONS
-- ============================================

-- Add scheduled_deletion_at for soft delete functionality
-- When set, the account is scheduled for deletion after 7-day grace period
-- User can cancel by logging in, which clears this field
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS scheduled_deletion_at TIMESTAMPTZ NULL;

COMMENT ON COLUMN public.profiles.scheduled_deletion_at IS
    'Timestamp when account deletion was requested. Account will be permanently deleted 7 days after this date. User can cancel by logging in within grace period.';

-- Add is_private for profile visibility toggle
-- FALSE (default): Profile is public, visible to all users
-- TRUE: Profile is private, only visible to the user themselves
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT FALSE NOT NULL;

COMMENT ON COLUMN public.profiles.is_private IS
    'When true, profile is hidden from public view. Default is false (public) for new accounts.';

-- Index for efficient scheduled deletion cleanup queries
-- Partial index only includes rows with non-null deletion dates
CREATE INDEX IF NOT EXISTS idx_profiles_scheduled_deletion
ON public.profiles(scheduled_deletion_at)
WHERE scheduled_deletion_at IS NOT NULL;

-- ============================================
-- AVATARS STORAGE BUCKET
-- ============================================

-- Create avatars bucket (private - not publicly accessible)
-- Note: If bucket already exists, this will be a no-op
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', false)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- AVATARS STORAGE RLS POLICIES
-- ============================================

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can view avatars based on privacy" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;

-- Policy: Users can upload files only to their own folder
-- Path pattern: avatars/{user_id}/filename
CREATE POLICY "Users can upload their own avatar"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can view their own files, or files of users with public profiles
-- This respects the is_private setting on profiles
CREATE POLICY "Users can view avatars based on privacy"
ON storage.objects
FOR SELECT
TO authenticated
USING (
    bucket_id = 'avatars'
    AND (
        -- User can always view their own avatar
        (storage.foldername(name))[1] = auth.uid()::text
        OR
        -- User can view other avatars if the owner's profile is public
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = (storage.foldername(name))[1]::uuid
            AND is_private = false
        )
    )
);

-- Policy: Users can update only their own avatar files
CREATE POLICY "Users can update their own avatar"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can delete only their own avatar files
CREATE POLICY "Users can delete their own avatar"
ON storage.objects
FOR DELETE
TO authenticated
USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
);
