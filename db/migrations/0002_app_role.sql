-- The website connects as kaara_app, which can only reach the lead tables.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'kaara_app') THEN
    GRANT USAGE ON SCHEMA public TO kaara_app;
    REVOKE ALL ON leads, lead_events, lead_notes, rate_limits, schema_migrations FROM kaara_app;
    GRANT SELECT, INSERT, UPDATE ON leads, lead_events TO kaara_app;
    GRANT SELECT, INSERT ON lead_notes TO kaara_app;
    GRANT SELECT, INSERT, UPDATE, DELETE ON rate_limits TO kaara_app;
    REVOKE ALL ON SCHEMA neon_auth FROM kaara_app;
    REVOKE ALL ON ALL TABLES IN SCHEMA neon_auth FROM kaara_app;
  END IF;
END $$;
