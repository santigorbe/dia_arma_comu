import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../../src/app.js';
import { FakeDb } from '../helpers/fakeDb.js';
import { testEnv } from '../helpers/testEnv.js';

function payload(overrides: Record<string, unknown> = {}) {
  return {
    requestIdempotencyKey: '550e8400-e29b-41d4-a716-446655440002',
    visitId: '550e8400-e29b-41d4-a716-446655440000',
    fullName: 'Participant Name',
    email: 'person@example.test',
    consent: { accepted: true, version: 'consent-2026-09' },
    ...overrides
  };
}

describe('registration validation and idempotency', () => {
  it('rejects invalid and undeclared fields without storing partial personal data', async () => {
    const db = new FakeDb();
    const response = await request(createApp(testEnv, db)).post('/api/public/registrations').send(payload({ email: 'not-email', extraSecret: 'hidden' }));
    expect(response.status).toBe(400);
    expect(db.participants.size).toBe(0);
    expect(JSON.stringify(response.body)).not.toMatch(/hidden|person@example|Participant/i);
  });

  it('replays an accepted request idempotently without duplicate participants', async () => {
    const db = new FakeDb();
    const app = createApp(testEnv, db);
    const first = await request(app).post('/api/public/registrations').send(payload());
    const second = await request(app).post('/api/public/registrations').send(payload());
    expect(first.status).toBe(201);
    expect(second.body).toEqual(first.body);
    expect(db.participants.size).toBe(1);
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
});
