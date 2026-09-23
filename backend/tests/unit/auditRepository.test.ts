import { describe, expect, it } from 'vitest';
import { appendAuditEvent, assertAuditAppendOnly } from '../../src/shared/audit/auditRepository.js';
import { FakeDb } from '../helpers/fakeDb.js';

describe('audit repository', () => {
  it('appends audit events and exposes no update/delete API', async () => {
    const db = new FakeDb();
    const event = await appendAuditEvent(db, { actorType: 'system', action: 'publish', targetType: 'content', targetId: 'event', outcome: 'success' });
    await assertAuditAppendOnly(db);

    expect(event.id).toBeDefined();
    expect(db.statements.some((statement) => /INSERT INTO audit_events/.test(statement))).toBe(true);
    expect(db.statements.some((statement) => /^\s*(UPDATE|DELETE)\s+audit_events/i.test(statement))).toBe(false);
  });
});
