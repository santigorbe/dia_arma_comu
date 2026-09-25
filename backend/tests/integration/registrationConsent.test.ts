import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../../src/app.js';
import { FakeDb } from '../helpers/fakeDb.js';
import { testEnv } from '../helpers/testEnv.js';

const basePayload = {
  requestIdempotencyKey: '550e8400-e29b-41d4-a716-446655440001',
  visitId: '550e8400-e29b-41d4-a716-446655440000',
  fullName: 'Participant Name',
  email: 'person@example.test',
  personnelType: 'civil',
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

  it('preserves a legacy organization when omitted and still rejects explicit conflicts', async () => {
    const db = new FakeDb();
    const app = createApp(testEnv, db);
    const first = await request(app).post('/api/public/registrations').send({ ...basePayload, unitOrOrganization: 'Existing unit' });
    expect(first.status).toBe(201);
    const repeat = await request(app).post('/api/public/registrations').send({ ...basePayload, requestIdempotencyKey: '550e8400-e29b-41d4-a716-446655440002' });
    expect(repeat.status).toBe(201);
    expect(repeat.body.participantId).toBe(first.body.participantId);
    expect(db.participants.size).toBe(1);
    expect([...db.participants.values()][0].unit_or_organization).toBe('Existing unit');
    const conflict = await request(app).post('/api/public/registrations').send({ ...basePayload, requestIdempotencyKey: '550e8400-e29b-41d4-a716-446655440003', unitOrOrganization: 'Different unit' });
    expect(conflict.status).toBe(409);
    expect(conflict.body.error).toBe('participant_conflict');
  });
});
