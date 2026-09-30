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
  email: 'person@example.test',
  consent: { accepted: true, version: 'consent-2026-09' }
};

describe('backend-enforced consent', () => {
  it('creates no personal record when consent is missing or false', async () => {
    const db = new FakeDb();
    const response = await request(createApp(testEnv, db)).post('/api/public/registrations').send({ ...basePayload, consent: { accepted: false, version: 'consent-2026-09' } });
    expect(response.status).toBe(400);
    expect(db.participants.size).toBe(0);
  });

  it('rejects stale consent and identifies the active version', async () => {
    const response = await request(createApp(testEnv, new FakeDb())).post('/api/public/registrations').send({ ...basePayload, consent: { accepted: true, version: 'old' } });
    expect(response.status).toBe(409);
    expect(response.body).toMatchObject({ error: 'stale_consent_version', details: { activeConsentVersion: 'consent-2026-09' } });
  });

  it('accepts valid direct API consent with a server-observed registration', async () => {
    const db = new FakeDb();
    const response = await request(createApp(testEnv, db)).post('/api/public/registrations').send(basePayload);
    expect(response.status).toBe(201);
    expect(response.body.status).toBe('registered');
    expect(db.participants.size).toBe(1);
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
