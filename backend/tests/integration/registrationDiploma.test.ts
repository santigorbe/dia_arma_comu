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
    personnelType: 'civil',
    consent: { accepted: true, version: 'consent-2026-09' },
    ...overrides
  };
}

describe('automatic registration diploma delivery', () => {
  it('queues one civil snapshot for a new participant and no additional snapshot for replay or compatible repeat registration', async () => {
    const db = new FakeDb();
    const app = createApp(testEnv, db);
    const first = await request(app).post('/api/public/registrations').send(payload());
    const replay = await request(app).post('/api/public/registrations').send(payload());
    const compatibleRepeat = await request(app).post('/api/public/registrations').send(payload({ requestIdempotencyKey: '550e8400-e29b-41d4-a716-446655440011' }));

    expect(first.status).toBe(201);
    expect(replay.body).toEqual(first.body);
    expect(compatibleRepeat.status).toBe(201);
    expect(db.diplomaCampaigns).toEqual([expect.objectContaining({ origin: 'registration', audienceCount: 1 })]);
    expect(db.diplomaDeliveries).toEqual([expect.objectContaining({
      participant_id: first.body.participantId,
      recipient_email: 'diploma@example.test',
      participant_name: 'Participant Name',
      military_rank: 'NA',
      diploma_grade: 'Señor/a'
    })]);
    expect(db.statements.filter((statement) => statement.includes('INSERT INTO diploma_campaigns'))).toHaveLength(1);
    expect(db.statements.filter((statement) => statement.includes('INSERT INTO diploma_deliveries'))).toHaveLength(1);
  });

  it('snapshots military diploma rank and retirement status for the existing worker contract', async () => {
    const db = new FakeDb();
    const response = await request(createApp(testEnv, db)).post('/api/public/registrations').send(payload({
      email: 'retired@example.test',
      personnelType: 'militar',
      militaryRank: 'Coronel (COM)',
      serviceStatus: 'retiro'
    }));

    expect(response.status).toBe(201);
    expect(db.diplomaDeliveries).toEqual([expect.objectContaining({ military_rank: 'Coronel (COM)', diploma_grade: 'Coronel (R)' })]);
  });

  it('does not queue a delivery for validation, consent, or participant conflict failures', async () => {
    const db = new FakeDb();
    const app = createApp(testEnv, db);
    const invalid = await request(app).post('/api/public/registrations').send(payload({ email: 'not-email' }));
    const missingConsent = await request(app).post('/api/public/registrations').send(payload({ requestIdempotencyKey: '550e8400-e29b-41d4-a716-446655440012', consent: { accepted: false, version: 'consent-2026-09' } }));
    await request(app).post('/api/public/registrations').send(payload({ requestIdempotencyKey: '550e8400-e29b-41d4-a716-446655440013' }));
    const conflict = await request(app).post('/api/public/registrations').send(payload({ requestIdempotencyKey: '550e8400-e29b-41d4-a716-446655440014', fullName: 'Different Name' }));

    expect(invalid.status).toBe(400);
    expect(missingConsent.status).toBe(400);
    expect(conflict.status).toBe(409);
    expect(db.diplomaDeliveries).toHaveLength(1);
  });
});
