-- Guests can open only what is shared with them. Articles use "type:id" as the item id.
ALTER TABLE staff_users DROP CONSTRAINT staff_users_role_check;
ALTER TABLE staff_users ADD CONSTRAINT staff_users_role_check
  CHECK (role IN ('super_admin', 'admin', 'sales', 'marketing', 'guest'));

CREATE TABLE shared_items (
  kind       text NOT NULL CHECK (kind IN ('content', 'design')),
  item_id    text NOT NULL,
  email      text NOT NULL CHECK (email = lower(email)),
  title      text NOT NULL,
  created_by text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (kind, item_id, email)
);
CREATE INDEX shared_items_email_idx ON shared_items (email, created_at DESC);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'kaara_app') THEN
    REVOKE ALL ON shared_items FROM kaara_app;
    GRANT SELECT, INSERT, UPDATE, DELETE ON shared_items TO kaara_app;
  END IF;
END $$;
