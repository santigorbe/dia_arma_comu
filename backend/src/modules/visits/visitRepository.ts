import type { Queryable } from '../../db/pool.js';

export async function touchVisit(db: Queryable, visitId: string) {
  await db.query(
    `INSERT INTO anonymous_visits (id, last_seen_at)
     VALUES ($1, now())
     ON CONFLICT (id) DO UPDATE SET last_seen_at = now()`,
    [visitId]
  );
}
