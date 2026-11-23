-- WhatsApp conversations, social publishing, team mail and an admin audit trail.
ALTER TABLE leads
  ADD COLUMN listing_type text,
  ADD COLUMN whatsapp_name text,
  ADD COLUMN social_profiles jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE lead_events ADD COLUMN listing_type text;

CREATE INDEX leads_listing_type_idx ON leads (listing_type, last_activity_at DESC);
CREATE INDEX lead_events_listing_type_idx ON lead_events (listing_type, created_at DESC);

CREATE TABLE whatsapp_messages (
  id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  wa_message_id text NOT NULL UNIQUE,
  lead_id       uuid REFERENCES leads (id) ON DELETE CASCADE,
  direction     text NOT NULL CHECK (direction IN ('in', 'out')),
  phone_digits  text NOT NULL,
  message_type  text NOT NULL DEFAULT 'text',
  body          text,
  ref           text,
  sent_by       text,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX whatsapp_messages_lead_idx ON whatsapp_messages (lead_id, created_at DESC);

CREATE TABLE content_posts (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title         text,
  body          text NOT NULL DEFAULT '',
  channels      text[] NOT NULL DEFAULT '{}',
  media         text[] NOT NULL DEFAULT '{}',
  variants      jsonb NOT NULL DEFAULT '{}'::jsonb,
  link_url      text,
  status        text NOT NULL DEFAULT 'draft'
                CHECK (status IN ('draft', 'scheduled', 'publishing', 'posted', 'failed', 'cancelled')),
  scheduled_for timestamptz,
  posted_at     timestamptz,
  results       jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by    text NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX content_posts_due_idx ON content_posts (status, scheduled_for);

CREATE TABLE social_connections (
  channel          text PRIMARY KEY,
  account_id       text NOT NULL,
  account_name     text,
  access_token_enc text NOT NULL,
  connected_by     text NOT NULL,
  connected_at     timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE mail_accounts (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label        text NOT NULL,
  email        text NOT NULL UNIQUE,
  username     text NOT NULL,
  password_enc text NOT NULL,
  imap_host    text NOT NULL,
  imap_port    integer NOT NULL,
  imap_secure  boolean NOT NULL DEFAULT true,
  smtp_host    text NOT NULL,
  smtp_port    integer NOT NULL,
  smtp_secure  boolean NOT NULL DEFAULT true,
  connected_by text NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE mail_snippets (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,
  body_html  text NOT NULL,
  created_by text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE mail_settings (
  admin_email    text PRIMARY KEY,
  signature_html text NOT NULL DEFAULT '',
  undo_seconds   integer NOT NULL DEFAULT 10 CHECK (undo_seconds IN (0, 5, 10, 20, 30)),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE admin_audit (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  actor_email text NOT NULL,
  action      text NOT NULL,
  target      text,
  details     jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX admin_audit_created_idx ON admin_audit (created_at DESC);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'kaara_app') THEN
    REVOKE ALL ON whatsapp_messages, content_posts, social_connections, mail_accounts,
      mail_snippets, mail_settings, admin_audit FROM kaara_app;
    GRANT SELECT, INSERT ON whatsapp_messages, admin_audit TO kaara_app;
    GRANT UPDATE (lead_id) ON whatsapp_messages TO kaara_app;
    GRANT SELECT, INSERT, UPDATE, DELETE ON content_posts, social_connections, mail_accounts,
      mail_snippets, mail_settings TO kaara_app;
  END IF;
END $$;
