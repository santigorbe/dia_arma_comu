ALTER TABLE event_content ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
CREATE INDEX IF NOT EXISTS event_content_public_order
  ON event_content (content_key) WHERE state = 'published' AND deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS admin_token_invalidations_expiry ON admin_token_invalidations (expires_at);
