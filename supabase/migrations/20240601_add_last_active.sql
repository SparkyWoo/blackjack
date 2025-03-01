-- Add last_active column to players table
ALTER TABLE players ADD COLUMN last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create a function to clean up inactive players
CREATE OR REPLACE FUNCTION cleanup_inactive_players()
RETURNS void AS $$
BEGIN
  -- Mark players as inactive if they haven't been active for more than 10 minutes
  UPDATE players
  SET is_active = FALSE
  WHERE is_active = TRUE
    AND last_active < NOW() - INTERVAL '10 minutes';
END;
$$ LANGUAGE plpgsql;

-- Create a cron job to run the cleanup function every 5 minutes
-- Note: This requires the pg_cron extension to be enabled
-- If pg_cron is not available, you can run this manually or set up an external cron job
-- COMMENT OUT THIS SECTION IF pg_cron IS NOT AVAILABLE
/*
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- The cron expression "every 5 minutes" can be written as "0/5 * * * *" to avoid syntax issues
SELECT cron.schedule(
  'cleanup-inactive-players',
  '0/5 * * * *',  -- Run every 5 minutes
  $$SELECT cleanup_inactive_players()$$
);
*/ 