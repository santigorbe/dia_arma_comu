import request from 'supertest';
import crypto from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { createApp } from '../../src/app.js';
import { FakeDb } from '../helpers/fakeDb.js';
import { testEnv } from '../helpers/testEnv.js';

const basePayload = {
  requestIdempotencyKey: '550e8400-e29b-41d4-a716-446655440001',
  visitId: '550e8400-e29b-41d4-a716-446655440000',
  fullName: 'Participant Name',
  email: 'person@example.test'
};

describe('consent-free registration contract', () => {
  it('accepts a consent-free payload without querying or persisting consent', async () => {
    const db = new FakeDb();
    const response = await request(createApp(testEnv, db)).post('/api/public/registrations').send(basePayload);
    expect(response.status).toBe(201);
    expect(response.body).toEqual({ participantId: expect.any(String), status: 'registered' });
    expect(db.participants.size).toBe(1);
    expect(db.statements.some((statement) => statement.includes('consent_versions') || statement.includes('registration_consents'))).toBe(false);
  });

  it('rejects a legacy consent object without creating a personal record', async () => {
    const db = new FakeDb();
    const response = await request(createApp(testEnv, db)).post('/api/public/registrations').send({ ...basePayload, consent: { accepted: false, version: 'old' } });
    expect(response.status).toBe(400);
    expect(db.participants.size).toBe(0);
  });

  it('accepts a matching historical participant without changing legacy columns', async () => {
    const db = new FakeDb();
    const app = createApp(testEnv, db);
    const id = crypto.randomUUID();
    db.participants.set(basePayload.email, { id, full_name: basePayload.fullName, email: basePayload.email, phone: '+5493511234567', unit_or_organization: 'Existing unit', personnel_type: 'militar', military_rank: 'Coronel', service_status: 'actividad' });

    const repeat = await request(app).post('/api/public/registrations').send(basePayload);
    expect(repeat.status).toBe(201);
    expect(repeat.body.participantId).toBe(id);
    expect(db.participants.size).toBe(1);
    expect([...db.participants.values()][0].unit_or_organization).toBe('Existing unit');
  });
});
