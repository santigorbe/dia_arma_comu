import type { Queryable } from '../../db/pool.js';

export type PublicContent = { key: string; title: string; body: string };
export type PublicScheduleEntry = { id: string; title: string; description: string | null; startsAt: string; endsAt: string; location: string | null; category: string | null };
export type PublicMapPoint = { id: string; label: string; description: string | null; latitude: number; longitude: number };

export async function readPublishedContent(db: Queryable): Promise<PublicContent[]> {
  const result = await db.query(
    `SELECT content_key AS key, title, body
     FROM event_content
     WHERE state = $1 AND published_at IS NOT NULL AND deleted_at IS NULL
     ORDER BY content_key ASC`,
    ['published']
  );
  return result.rows as PublicContent[];
}

export async function readPublishedSchedule(db: Queryable): Promise<PublicScheduleEntry[]> {
  const result = await db.query(
    `SELECT id, title, description, starts_at AS "startsAt", ends_at AS "endsAt", location, category
     FROM schedule_entries
     WHERE state = $1 AND deleted_at IS NULL AND published_at IS NOT NULL
     ORDER BY starts_at ASC, ends_at ASC, id ASC`,
    ['published']
  );
  return result.rows.map((row) => ({ ...row, startsAt: new Date(row.startsAt as string).toISOString(), endsAt: new Date(row.endsAt as string).toISOString() })) as PublicScheduleEntry[];
}

export async function readPublishedMapPoints(db: Queryable): Promise<PublicMapPoint[]> {
  const result = await db.query(
    `SELECT id, label, description, latitude::float8 AS latitude, longitude::float8 AS longitude
     FROM map_points
     WHERE state = $1 AND deleted_at IS NULL AND published_at IS NOT NULL
     ORDER BY label ASC, id ASC`,
    ['published']
  );
  return result.rows as PublicMapPoint[];
}
