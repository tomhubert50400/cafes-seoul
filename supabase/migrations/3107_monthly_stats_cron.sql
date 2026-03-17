-- Schedule monthly stats aggregation: 2 AM on 1st of each month
select cron.schedule(
  'aggregate-monthly-cafe-stats',
  '0 2 1 * *',
  $$
  select net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/aggregate-monthly-stats',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);
