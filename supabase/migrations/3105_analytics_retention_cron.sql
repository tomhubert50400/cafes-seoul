-- Prune analytics events older than 13 months (monthly)
select cron.schedule(
  'prune-analytics-events',
  '0 3 1 * *',
  $$DELETE FROM analytics_events WHERE created_at < now() - interval '13 months'$$
);
