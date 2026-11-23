-- One row per person. Repeat enquiries attach to the same lead through events.
CREATE TABLE leads (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ref                text NOT NULL UNIQUE
                     DEFAULT 'L-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)),
  status             text NOT NULL DEFAULT 'new'
                     CHECK (status IN ('new', 'contacted', 'viewing', 'negotiating', 'won', 'lost')),
  name               text,
  phone              text,
  phone_digits       text,
  email              text,
  latest_kind        text NOT NULL,
  latest_message     text,
  listing_title      text,
  listing_slug       text,
  landing_path       text,
  referrer           text,
  utm_source         text,
  utm_medium         text,
  utm_campaign       text,
  marketing_consent  boolean NOT NULL DEFAULT false,
  consent_at         timestamptz,
  first_contacted_at timestamptz,
  created_at         timestamptz NOT NULL DEFAULT now(),
  last_activity_at   timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX leads_phone_digits_key ON leads (phone_digits) WHERE phone_digits IS NOT NULL;
CREATE INDEX leads_email_idx ON leads (lower(email)) WHERE email IS NOT NULL;
CREATE INDEX leads_status_activity_idx ON leads (status, last_activity_at DESC);
CREATE INDEX leads_activity_idx ON leads (last_activity_at DESC);

-- What happened: form submissions, WhatsApp clicks and status changes.
CREATE TABLE lead_events (
  id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  lead_id       uuid REFERENCES leads (id) ON DELETE CASCADE,
  type          text NOT NULL,
  ref           text,
  path          text,
  placement     text,
  listing_title text,
  listing_slug  text,
  referrer      text,
  utm_source    text,
  utm_medium    text,
  utm_campaign  text,
  meta          jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX lead_events_lead_idx ON lead_events (lead_id, created_at DESC);
CREATE INDEX lead_events_type_idx ON lead_events (type, created_at DESC);
CREATE UNIQUE INDEX lead_events_whatsapp_ref_key ON lead_events (ref)
  WHERE type = 'whatsapp_click' AND ref IS NOT NULL;

CREATE TABLE lead_notes (
  id           bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  lead_id      uuid NOT NULL REFERENCES leads (id) ON DELETE CASCADE,
  author_email text NOT NULL,
  body         text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 4000),
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX lead_notes_lead_idx ON lead_notes (lead_id, created_at DESC);

-- Keyed by a salted hash, so visitor IP addresses are never stored.
CREATE TABLE rate_limits (
  key          text NOT NULL,
  window_start timestamptz NOT NULL,
  count        integer NOT NULL DEFAULT 1,
  PRIMARY KEY (key, window_start)
);
