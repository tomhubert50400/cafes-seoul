-- Phase 18: Daily Email Digest Cron Job Setup
-- Runs at 0:00 UTC (9:00 AM KST) daily

-- Note: Before running this migration, you must manually store secrets in Vault:
--
-- Run in SQL Editor (with appropriate values):
-- SELECT vault.create_secret('https://YOUR-PROJECT-REF.supabase.co', 'supabase_url');
-- SELECT vault.create_secret('YOUR_SERVICE_ROLE_KEY', 'service_role_key');
--
-- These secrets are used by the cron job to authenticate with the Edge Function.

-- Schedule daily email digest at 9 AM KST (0:00 UTC)
-- Using pg_cron + pg_net to call the Edge Function
SELECT cron.schedule(
  'daily-email-digest',
  '0 0 * * *',  -- 0:00 UTC = 9:00 AM KST (UTC+9)
  $$
  SELECT net.http_post(
    url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'supabase_url')
           || '/functions/v1/send-daily-digest',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'service_role_key')
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);

-- Add comment for documentation
COMMENT ON EXTENSION pg_cron IS 'Job scheduler for PostgreSQL - used for daily email digest at 9 AM KST';

-- Helper function to manually trigger the digest (for testing)
CREATE OR REPLACE FUNCTION trigger_email_digest()
RETURNS jsonb AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT net.http_post(
    url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'supabase_url')
           || '/functions/v1/send-daily-digest',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'service_role_key')
    ),
    body := '{}'::jsonb
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION trigger_email_digest IS 'Manually trigger the daily email digest Edge Function (for testing)';
