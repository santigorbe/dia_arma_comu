import type { Queryable } from '../../db/pool.js';

export type AuditEventInput = {
  actorType: 'admin' | 'system';
  actorId?: string;
  action: string;
  targetType: string;
  targetId: string;
  outcome: 'success' | 'failure';
  metadata?: Record<string, unknown>;
};

export async function appendAuditEvent(db: Queryable, event: AuditEventInput) {
  const result = await db.query(
    `INSERT INTO audit_events (actor_type, actor_id, action, target_type, target_id, outcome, metadata)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, created_at`,
    [event.actorType, event.actorId ?? null, event.action, event.targetType, event.targetId, event.outcome, event.metadata ?? {}]
  );

  return result.rows[0];
}

export async function assertAuditAppendOnly(db: Queryable) {
  await db.query(`REVOKE UPDATE, DELETE ON audit_events FROM PUBLIC`, []);
}
