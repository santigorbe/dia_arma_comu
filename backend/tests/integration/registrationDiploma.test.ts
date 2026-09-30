import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../../src/app.js';
import { FakeDb } from '../helpers/fakeDb.js';
import { testEnv } from '../helpers/testEnv.js';

function payload(overrides: Record<string, unknown> = {}) {
  return {
    requestIdempotencyKey: '550e8400-e29b-41d4-a716-446655440010',
    visitId: '550e8400-e29b-41d4-a716-446655440000',
    fullName: 'Participant Name',
    email: 'diploma@example.test',
    ...overrides
  };
}

describe('automatic registration diploma delivery', () => {
  it('queues one Señor/a snapshot for a new participant and no additional snapshot for replay or compatible repeat registration', async () => {
    const db = new FakeDb();
    const app = createApp(testEnv, db);
    const registration = payload({ email: 'santigorbe@gmail.com' });
    const first = await request(app).post('/api/public/registrations').send(registration);
    const replay = await request(app).post('/api/public/registrations').send(registration);
    const compatibleRepeat = await request(app).post('/api/public/registrations').send({ ...registration, requestIdempotencyKey: '550e8400-e29b-41d4-a716-446655440011' });

    expect(first.status).toBe(201);
    expect(replay.body).toEqual(first.body);
    expect(compatibleRepeat.status).toBe(201);
    expect(db.diplomaCampaigns).toEqual([expect.objectContaining({ origin: 'registration', audienceCount: 1 })]);
    expect(db.diplomaDeliveries).toEqual([expect.objectContaining({
      participant_id: first.body.participantId,
      recipient_email: 'santigorbe@gmail.com',
      participant_name: 'Participant Name',
      military_rank: 'NA',
      diploma_grade: 'Señor/a'
    })]);
    expect(db.statements.filter((statement) => statement.includes('INSERT INTO diploma_campaigns'))).toHaveLength(1);
    expect(db.statements.filter((statement) => statement.includes('INSERT INTO diploma_deliveries'))).toHaveLength(1);
    expect(db.statements.filter((statement) => statement.includes('communication_jobs'))).toHaveLength(0);
  });

  it('does not queue a delivery for validation or participant conflict failures', async () => {
    const db = new FakeDb();
    const app = createApp(testEnv, db);
    const invalid = await request(app).post('/api/public/registrations').send(payload({ email: 'not-email' }));
    await request(app).post('/api/public/registrations').send(payload({ requestIdempotencyKey: '550e8400-e29b-41d4-a716-446655440013' }));
    const conflict = await request(app).post('/api/public/registrations').send(payload({ requestIdempotencyKey: '550e8400-e29b-41d4-a716-446655440014', fullName: 'Different Name' }));

    expect(invalid.status).toBe(400);
    expect(conflict.status).toBe(409);
    expect(db.diplomaDeliveries).toHaveLength(1);
  });
});
