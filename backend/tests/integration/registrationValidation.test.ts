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
    personnelType: 'civil',
    consent: { accepted: true, version: 'consent-2026-09' },
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

  it('queues one email job for each accepted idempotency key and none for an exact replay', async () => {
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
    expect(db.communicationJobs).toEqual([
      { recipient_ref: 'person@example.test', idempotency_key: 'registration-email:550e8400-e29b-41d4-a716-446655440002' },
      { recipient_ref: 'person@example.test', idempotency_key: 'registration-email:550e8400-e29b-41d4-a716-446655440004' }
    ]);
    expect(db.statements.filter((statement) => statement.includes('INSERT INTO communication_jobs'))).toHaveLength(2);
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

  it('requires a militaryRank when personnelType is militar', async () => {
    const db = new FakeDb();
    const response = await request(createApp(testEnv, db)).post('/api/public/registrations').send(payload({ email: 'militar@example.test', personnelType: 'militar' }));
    expect(response.status).toBe(400);
    expect(db.participants.size).toBe(0);
  });

  it('rejects a militaryRank when personnelType is civil', async () => {
    const db = new FakeDb();
    const response = await request(createApp(testEnv, db)).post('/api/public/registrations').send(payload({ email: 'civil@example.test', personnelType: 'civil', militaryRank: 'Coronel' }));
    expect(response.status).toBe(400);
    expect(db.participants.size).toBe(0);
  });

  it('registers a military participant with their rank', async () => {
    const db = new FakeDb();
    const response = await request(createApp(testEnv, db)).post('/api/public/registrations').send(payload({ email: 'militar-ok@example.test', personnelType: 'militar', militaryRank: 'Coronel', serviceStatus: 'actividad' }));
    expect(response.status).toBe(201);
    const stored = [...db.participants.values()][0];
    expect(stored.personnel_type).toBe('militar');
    expect(stored.military_rank).toBe('Coronel');
    expect(stored.service_status).toBe('actividad');
  });

  it('requires a serviceStatus when personnelType is militar', async () => {
    const db = new FakeDb();
    const response = await request(createApp(testEnv, db)).post('/api/public/registrations').send(payload({ email: 'militar-nosit@example.test', personnelType: 'militar', militaryRank: 'Coronel' }));
    expect(response.status).toBe(400);
    expect(db.participants.size).toBe(0);
  });

  it('rejects a serviceStatus when personnelType is civil', async () => {
    const db = new FakeDb();
    const response = await request(createApp(testEnv, db)).post('/api/public/registrations').send(payload({ email: 'civil-sit@example.test', personnelType: 'civil', serviceStatus: 'actividad' }));
    expect(response.status).toBe(400);
    expect(db.participants.size).toBe(0);
  });
});
