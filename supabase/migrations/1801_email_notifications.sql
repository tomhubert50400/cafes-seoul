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

-- ============================================
-- TRIGGER FUNCTIONS
-- ============================================

-- Trigger function for cafe submission status changes
CREATE OR REPLACE FUNCTION public.queue_cafe_status_notification()
RETURNS TRIGGER AS $$
DECLARE
    v_cafe_slug VARCHAR(255);
BEGIN
    -- Only trigger on status change from pending to approved/declined
    IF (OLD.status = 'pending' AND NEW.status IN ('approved', 'declined')) THEN
        -- Get cafe slug if approved (for direct link in email)
        IF NEW.status = 'approved' AND NEW.cafe_id IS NOT NULL THEN
            SELECT slug INTO v_cafe_slug FROM public.cafes WHERE id = NEW.cafe_id;
        END IF;

        INSERT INTO public.pending_email_notifications (
            user_id,
            notification_type,
            submission_type,
            submission_id,
            cafe_name,
            cafe_slug,
            rejection_reason
        ) VALUES (
            NEW.user_id,
            CASE WHEN NEW.status = 'approved' THEN 'cafe_approved' ELSE 'cafe_rejected' END,
            'cafe',
            NEW.id,
            NEW.name,
            v_cafe_slug,
            CASE WHEN NEW.status = 'declined' THEN NEW.rejection_reason ELSE NULL END
        );
    END IF;

    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    -- Log error but don't fail the main operation (RESEARCH.md Pitfall 5)
    RAISE WARNING 'Failed to queue cafe notification: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.queue_cafe_status_notification IS 'Queue email notification when cafe submission status changes to approved/declined';

-- Trigger function for photo submission status changes
CREATE OR REPLACE FUNCTION public.queue_photo_status_notification()
RETURNS TRIGGER AS $$
DECLARE
    v_cafe_name JSONB;
    v_cafe_slug VARCHAR(255);
BEGIN
    -- Only trigger on status change from pending to approved/rejected
    IF (OLD.status = 'pending' AND NEW.status IN ('approved', 'rejected')) THEN
        -- Get cafe name and slug from cafes table
        SELECT name, slug INTO v_cafe_name, v_cafe_slug
        FROM public.cafes WHERE id = NEW.cafe_id;

        INSERT INTO public.pending_email_notifications (
            user_id,
            notification_type,
            submission_type,
            submission_id,
            cafe_name,
            cafe_slug,
            rejection_reason
        ) VALUES (
            NEW.user_id,
            CASE WHEN NEW.status = 'approved' THEN 'photo_approved' ELSE 'photo_rejected' END,
            'photo',
            NEW.id,
            v_cafe_name,
            v_cafe_slug,
            CASE WHEN NEW.status = 'rejected' THEN NEW.rejection_reason ELSE NULL END
        );
    END IF;

    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    -- Log error but don't fail the main operation (RESEARCH.md Pitfall 5)
    RAISE WARNING 'Failed to queue photo notification: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.queue_photo_status_notification IS 'Queue email notification when photo status changes to approved/rejected';

-- ============================================
-- TRIGGERS
-- ============================================

-- Trigger on cafe_submissions table for status changes
DROP TRIGGER IF EXISTS on_cafe_submission_status_change ON public.cafe_submissions;
CREATE TRIGGER on_cafe_submission_status_change
    AFTER UPDATE ON public.cafe_submissions
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status)
    EXECUTE FUNCTION public.queue_cafe_status_notification();

COMMENT ON TRIGGER on_cafe_submission_status_change ON public.cafe_submissions IS 'Queue notification when cafe submission status changes';

-- Trigger on photos table for status changes
DROP TRIGGER IF EXISTS on_photo_status_change ON public.photos;
CREATE TRIGGER on_photo_status_change
    AFTER UPDATE ON public.photos
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status)
    EXECUTE FUNCTION public.queue_photo_status_notification();

COMMENT ON TRIGGER on_photo_status_change ON public.photos IS 'Queue notification when photo status changes';
