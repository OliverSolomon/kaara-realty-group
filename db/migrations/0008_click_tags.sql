-- Staff can label WhatsApp clicks and archive the ones they have dealt with.
ALTER TABLE lead_events
  ADD COLUMN click_tags text[] NOT NULL DEFAULT '{}',
  ADD COLUMN archived_at timestamptz;

CREATE INDEX lead_events_click_tags_idx ON lead_events USING gin (click_tags) WHERE type = 'whatsapp_click';
CREATE INDEX lead_events_active_clicks_idx ON lead_events (created_at DESC) WHERE type = 'whatsapp_click' AND archived_at IS NULL;
