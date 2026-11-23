-- Version history and uploaded media for the design studio.
ALTER TABLE designs ADD COLUMN source text NOT NULL DEFAULT 'blank';

CREATE TABLE design_versions (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  design_id  uuid NOT NULL REFERENCES designs (id) ON DELETE CASCADE,
  label      text NOT NULL DEFAULT 'Version',
  name       text NOT NULL,
  width      integer NOT NULL,
  height     integer NOT NULL,
  pages      jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX design_versions_design_idx ON design_versions (design_id, created_at DESC);

CREATE TABLE studio_media (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mime         text NOT NULL,
  name         text,
  size         integer NOT NULL CHECK (size BETWEEN 1 AND 41943040),
  url          text,
  asset_id     text,
  created_by   text NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  finalized_at timestamptz
);
CREATE INDEX studio_media_created_idx ON studio_media (created_at DESC);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'kaara_app') THEN
    REVOKE ALL ON design_versions, studio_media FROM kaara_app;
    GRANT SELECT, INSERT, UPDATE, DELETE ON design_versions, studio_media TO kaara_app;
  END IF;
END $$;
