-- Any number of mailboxes, large uploads, and saved designs.
ALTER TABLE mail_accounts
  ADD COLUMN auth_type text NOT NULL DEFAULT 'password'
  CHECK (auth_type IN ('password', 'google', 'microsoft'));

-- Vercel limits one request to 4.5 MB, so large PDFs arrive in parts and are removed once assembled.
CREATE TABLE upload_chunks (
  upload_id  uuid NOT NULL,
  part       integer NOT NULL CHECK (part >= 0),
  data       bytea NOT NULL,
  created_by text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (upload_id, part)
);
CREATE INDEX upload_chunks_created_idx ON upload_chunks (created_at);

CREATE TABLE designs (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL DEFAULT 'Untitled design',
  width         integer NOT NULL CHECK (width BETWEEN 16 AND 8000),
  height        integer NOT NULL CHECK (height BETWEEN 16 AND 8000),
  data          jsonb NOT NULL DEFAULT '{}'::jsonb,
  thumbnail_url text,
  created_by    text NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX designs_updated_idx ON designs (updated_at DESC);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'kaara_app') THEN
    REVOKE ALL ON upload_chunks, designs FROM kaara_app;
    GRANT SELECT, INSERT, UPDATE, DELETE ON upload_chunks, designs TO kaara_app;
  END IF;
END $$;
