-- Staff access. Emails in ADMIN_EMAILS are always super admins and are not stored here,
-- so a bad edit in this table can never lock the owners out.
CREATE TABLE staff_users (
  email      text PRIMARY KEY CHECK (email = lower(email)),
  name       text,
  role       text NOT NULL CHECK (role IN ('super_admin', 'admin', 'sales', 'marketing')),
  active     boolean NOT NULL DEFAULT true,
  created_by text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'kaara_app') THEN
    REVOKE ALL ON staff_users FROM kaara_app;
    GRANT SELECT, INSERT, UPDATE, DELETE ON staff_users TO kaara_app;
  END IF;
END $$;
