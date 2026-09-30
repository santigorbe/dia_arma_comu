import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../../src/app.js';
import { FakeDb } from '../helpers/fakeDb.js';
import { testEnv } from '../helpers/testEnv.js';
import { resetRateLimitsForTests } from '../../src/shared/http/rateLimits.js';

function payload(overrides: Record<string, unknown> = {}) {
  return {
    requestIdempotencyKey: '550e8400-e29b-41d4-a716-446655440002',
    visitId: '550e8400-e29b-41d4-a716-446655440000',
    fullName: 'Participant Name',
    email: 'person@example.test',
    ...overrides
  };
}

describe('registration validation and idempotency', () => {
  beforeEach(() => resetRateLimitsForTests());

  it('rejects invalid and undeclared fields without storing partial personal data', async () => {
    const db = new FakeDb();
    const app = createApp(testEnv, db);
    const first = await request(app).post('/api/public/registrations').send(payload({ email: 'not-email', extraSecret: 'hidden' }));
    const second = await request(app).post('/api/public/registrations').send(payload({ email: 'not-email', extraSecret: 'hidden' }));
    expect(first.status).toBe(400);
    expect(second.status).toBe(400);
    expect(first.body.details).toEqual([{ field: 'email', code: 'invalid_string' }]);
    expect(second.body.details).toEqual(first.body.details);
    expect(db.participants.size).toBe(0);
    expect(JSON.stringify(first.body)).not.toMatch(/hidden|not-email|person@example|Participant|message|value/i);
  });

  it('queues one automatic diploma delivery for accepted registrations and no confirmation email jobs', async () => {
    const db = new FakeDb();
    const app = createApp(testEnv, db);
    const first = await request(app).post('/api/public/registrations').send(payload());
    const second = await request(app).post('/api/public/registrations').send(payload());
    const repeat = await request(app).post('/api/public/registrations').send(payload({ requestIdempotencyKey: '550e8400-e29b-41d4-a716-446655440004' }));

    expect(first.status).toBe(201);
    expect(second.body).toEqual(first.body);
    expect(repeat.status).toBe(201);
    expect(repeat.body.participantId).toBe(first.body.participantId);
    expect(db.participants.size).toBe(1);
    expect(db.diplomaDeliveries).toEqual([expect.objectContaining({ recipient_email: 'person@example.test' })]);
    expect(db.statements.filter((statement) => statement.includes('INSERT INTO communication_jobs'))).toHaveLength(0);
    expect(db.statements.filter((statement) => statement === 'BEGIN')).toHaveLength(2);
    expect(db.statements.filter((statement) => statement === 'COMMIT')).toHaveLength(2);
  });

  it('returns a conflict for existing participants with different data', async () => {
    const db = new FakeDb();
    const app = createApp(testEnv, db);
    await request(app).post('/api/public/registrations').send(payload());
    const conflict = await request(app).post('/api/public/registrations').send(payload({ requestIdempotencyKey: '550e8400-e29b-41d4-a716-446655440003', fullName: 'Different Name' }));
    expect(conflict.status).toBe(409);
    expect(conflict.body.error).toBe('participant_conflict');
  });

  it('treats SQL-injection-shaped input only as parameterized data', async () => {
    const db = new FakeDb();
    const response = await request(createApp(testEnv, db)).post('/api/public/registrations').send(payload({ fullName: "Robert'); DROP TABLE participants;--" }));
    expect(response.status).toBe(201);
    expect(db.statements.some((statement) => statement.includes('DROP TABLE participants;--'))).toBe(false);
  });

  it.each(['phone', 'unitOrOrganization', 'personnelType', 'militaryRank', 'serviceStatus'])('rejects retired registration field %s without retaining it', async (field) => {
    const db = new FakeDb();
    const response = await request(createApp(testEnv, db)).post('/api/public/registrations').send(payload({ email: `${field}@example.test`, [field]: 'legacy-value' }));
    expect(response.status).toBe(400);
    expect(db.participants.size).toBe(0);
  });

  it('stores safe legacy defaults for a new registration', async () => {
    const db = new FakeDb();
    const response = await request(createApp(testEnv, db)).post('/api/public/registrations').send(payload());
    expect(response.status).toBe(201);
    expect([...db.participants.values()][0]).toMatchObject({ phone: null, unit_or_organization: null, personnel_type: 'civil', military_rank: null, service_status: null });
  });
});
