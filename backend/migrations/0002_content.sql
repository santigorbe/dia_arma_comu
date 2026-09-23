CREATE TABLE IF NOT EXISTS event_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_key text NOT NULL UNIQUE,
  title text NOT NULL,
  body text NOT NULL,
  state text NOT NULL CHECK (state IN ('draft', 'published')) DEFAULT 'draft',
  version integer NOT NULL DEFAULT 1,
  deleted_at timestamptz,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS schedule_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  location text,
  state text NOT NULL CHECK (state IN ('draft', 'published')) DEFAULT 'draft',
  version integer NOT NULL DEFAULT 1,
  deleted_at timestamptz,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (ends_at > starts_at)
);

CREATE INDEX IF NOT EXISTS schedule_entries_public_order
  ON schedule_entries (starts_at, ends_at)
  WHERE state = 'published' AND deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS map_points (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL,
  description text,
  latitude numeric(9,6) NOT NULL CHECK (latitude >= -90 AND latitude <= 90),
  longitude numeric(9,6) NOT NULL CHECK (longitude >= -180 AND longitude <= 180),
  state text NOT NULL CHECK (state IN ('draft', 'published')) DEFAULT 'draft',
  version integer NOT NULL DEFAULT 1,
  deleted_at timestamptz,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS map_points_public
  ON map_points (label)
  WHERE state = 'published' AND deleted_at IS NULL;
