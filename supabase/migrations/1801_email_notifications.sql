-- ============================================
-- EMAIL NOTIFICATIONS SYSTEM
-- Phase 18: Daily digest email notifications for submission status changes
-- ============================================

-- ============================================
-- ENABLE REQUIRED EXTENSIONS
-- ============================================

-- Enable pg_cron for scheduled job execution (daily digest at 9 AM KST)
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

-- Enable pg_net for HTTP requests from Postgres (trigger Edge Functions)
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- ============================================
-- PENDING EMAIL NOTIFICATIONS QUEUE TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.pending_email_notifications (
    -- Primary key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- User reference (recipient of notification)
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Notification type (what happened)
    notification_type VARCHAR(50) NOT NULL,

    -- Submission details for email content
    submission_type VARCHAR(20) NOT NULL,
    submission_id UUID NOT NULL,

    -- Cafe information for localized email content
    cafe_name JSONB,  -- TranslatedText format: {en, ko, fr, zh, vi}
    cafe_slug VARCHAR(255),  -- For direct link in approval emails, NULL for rejections

    -- Rejection reason (shown in rejection emails, NULL for approvals)
    rejection_reason TEXT,

    -- Processing state
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    sent_at TIMESTAMPTZ,  -- NULL until processed by daily digest

    -- Validation constraints
    CONSTRAINT valid_notification_type CHECK (
        notification_type IN ('cafe_approved', 'cafe_rejected', 'photo_approved', 'photo_rejected')
    ),
    CONSTRAINT valid_submission_type CHECK (
        submission_type IN ('cafe', 'photo')
    )
);

-- Table and column comments
COMMENT ON TABLE public.pending_email_notifications IS 'Queue for daily digest email notifications on submission status changes';
COMMENT ON COLUMN public.pending_email_notifications.id IS 'Unique notification ID';
COMMENT ON COLUMN public.pending_email_notifications.user_id IS 'User who will receive the notification email';
COMMENT ON COLUMN public.pending_email_notifications.notification_type IS 'Type of notification: cafe_approved, cafe_rejected, photo_approved, photo_rejected';
COMMENT ON COLUMN public.pending_email_notifications.submission_type IS 'Type of submission: cafe or photo';
COMMENT ON COLUMN public.pending_email_notifications.submission_id IS 'ID of the cafe_submission or photo record';
COMMENT ON COLUMN public.pending_email_notifications.cafe_name IS 'Cafe name in multiple languages (JSONB: {en, ko, fr, zh, vi})';
COMMENT ON COLUMN public.pending_email_notifications.cafe_slug IS 'Cafe slug for direct link in approval emails (NULL for rejections)';
COMMENT ON COLUMN public.pending_email_notifications.rejection_reason IS 'Reason for rejection shown to user (NULL for approvals)';
COMMENT ON COLUMN public.pending_email_notifications.created_at IS 'When the notification was queued (status change timestamp)';
COMMENT ON COLUMN public.pending_email_notifications.sent_at IS 'When the notification was sent via daily digest (NULL = unsent)';

-- ============================================
-- INDEXES
-- ============================================

-- Partial index for efficient daily digest query (unsent notifications grouped by user)
CREATE INDEX idx_pending_notifications_unsent
    ON public.pending_email_notifications(user_id, created_at)
    WHERE sent_at IS NULL;

COMMENT ON INDEX idx_pending_notifications_unsent IS 'Efficient query for unsent notifications in daily digest job';

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Enable RLS with NO public policies (service role only access)
-- Edge Functions use service_role to read/write this table
ALTER TABLE public.pending_email_notifications ENABLE ROW LEVEL SECURITY;

-- No policies created = only service_role can access
COMMENT ON TABLE public.pending_email_notifications IS 'Queue for daily digest email notifications (service_role access only)';
