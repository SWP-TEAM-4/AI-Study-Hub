INSERT INTO system_configs (config_key, config_value, description, is_public)
SELECT 'CONTENT_REPORT_DAILY_LIMIT', '10', 'Maximum content reports a user can create per day. Set 0 to disable the limit.', FALSE
WHERE NOT EXISTS (SELECT 1 FROM system_configs WHERE config_key = 'CONTENT_REPORT_DAILY_LIMIT');
