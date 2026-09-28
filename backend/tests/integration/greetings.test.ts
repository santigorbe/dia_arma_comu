import crypto from 'node:crypto';
import fs from 'node:fs';
import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../../src/app.js';
import { FakeDb } from '../helpers/fakeDb.js';
import { testEnv } from '../helpers/testEnv.js';
import { resetRateLimitsForTests } from '../../src/shared/http/rateLimits.js';

const AUTH_HEADER = `Bearer ${testEnv.INTEGRATIONS_API_TOKEN}`;

function registrationPayload(overrides: Record<string, unknown> = {}) {
  return {
    requestIdempotencyKey: crypto.randomUUID(),
    visitId: '550e8400-e29b-41d4-a716-446655440000',
    fullName: 'Participante Saludos',
    email: `saludos-${crypto.randomUUID()}@example.test`,
    phone: '+5493511234567',
    personnelType: 'civil',
    consent: { accepted: true, version: 'consent-2026-09' },
    ...overrides
  };
}

describe('WhatsApp greeting integration API', () => {
  beforeEach(() => resetRateLimitsForTests());
  afterAll(() => {
    fs.rmSync(testEnv.CARD_STORAGE_DIR, { recursive: true, force: true });
  });

  it('rejects requests without a valid token', async () => {
    const app = createApp(testEnv, new FakeDb());
    const noAuth = await request(app).get('/datos');
    expect(noAuth.status).toBe(401);
    const badAuth = await request(app).get('/datos').set('Authorization', 'Bearer wrong-token');
    expect(badAuth.status).toBe(401);
  });

  it('does not intercept unrelated routes when unauthenticated', async () => {
    const app = createApp(testEnv, new FakeDb());
    const response = await request(app).get('/missing-route');
    expect(response.status).toBe(404);
  });

  it('lists only participants with a phone number, in the shape n8n expects', async () => {
    const db = new FakeDb();
    const app = createApp(testEnv, db);
    await request(app).post('/api/public/registrations').send(registrationPayload({ fullName: 'Con Telefono', phone: '+5493511111111' }));
    await request(app).post('/api/public/registrations').send(
      registrationPayload({ fullName: 'Sin Telefono', phone: undefined, email: `sin-telefono-${crypto.randomUUID()}@example.test` })
    );

    const response = await request(app).get('/datos').set('Authorization', AUTH_HEADER);
    expect(response.status).toBe(200);
    expect(response.body).toEqual([{ nombre: 'Con Telefono', grado: null, numero: '+5493511111111', imagen: null }]);
  });

  it('includes the military rank as grado for military registrants', async () => {
    const db = new FakeDb();
    const app = createApp(testEnv, db);
    await request(app).post('/api/public/registrations').send(
      registrationPayload({ fullName: 'Grado Test', phone: '+5493512222222', personnelType: 'militar', militaryRank: 'Coronel (CR)', serviceStatus: 'actividad' })
    );

    const response = await request(app).get('/datos').set('Authorization', AUTH_HEADER);
    expect(response.body).toEqual([{ nombre: 'Grado Test', grado: 'Coronel (CR)', numero: '+5493512222222', imagen: null }]);
  });

  it('uploads a card image, links it to the participant, and serves it back', async () => {
    const db = new FakeDb();
    const app = createApp(testEnv, db);
    const registration = await request(app).post('/api/public/registrations').send(registrationPayload({ fullName: 'Con Tarjeta', phone: '+5493513333333' }));
    const participantId = registration.body.participantId as string;

    const upload = await request(app)
      .post(`/imagenes/${participantId}`)
      .set('Authorization', AUTH_HEADER)
      .attach('imagen', Buffer.from('fake-png-bytes'), { filename: 'card.png', contentType: 'image/png' });

    expect(upload.status).toBe(201);
    expect(upload.body.imagen).toMatch(new RegExp(`/imagenes/${participantId}\\.png$`));

    const datos = await request(app).get('/datos').set('Authorization', AUTH_HEADER);
    expect(datos.body[0].imagen).toBe(upload.body.imagen);

    const download = await request(app).get(`/imagenes/${participantId}.png`).set('Authorization', AUTH_HEADER);
    expect(download.status).toBe(200);
    expect(download.headers['content-type']).toMatch(/image\/png/);
  });

  it('rejects an upload for a participant that does not exist', async () => {
    const app = createApp(testEnv, new FakeDb());
    const response = await request(app)
      .post(`/imagenes/${crypto.randomUUID()}`)
      .set('Authorization', AUTH_HEADER)
      .attach('imagen', Buffer.from('fake-png-bytes'), { filename: 'card.png', contentType: 'image/png' });
    expect(response.status).toBe(404);
  });

  it('returns 404 for an image filename that was never uploaded', async () => {
    const app = createApp(testEnv, new FakeDb());
    const response = await request(app).get('/imagenes/does-not-exist.png').set('Authorization', AUTH_HEADER);
    expect(response.status).toBe(404);
  });

  it('rejects filenames shaped like a path traversal attempt', async () => {
    const app = createApp(testEnv, new FakeDb());
    const response = await request(app).get('/imagenes/..%2F..%2Fetc%2Fpasswd').set('Authorization', AUTH_HEADER);
    expect(response.status).toBe(400);
  });

  it('accepts the image route token as a query string, for direct browser viewing', async () => {
    const db = new FakeDb();
    const app = createApp(testEnv, db);
    const registration = await request(app).post('/api/public/registrations').send(registrationPayload({ fullName: 'Con Tarjeta Query', phone: '+5493514444444' }));
    const participantId = registration.body.participantId as string;

    await request(app)
      .post(`/imagenes/${participantId}`)
      .set('Authorization', AUTH_HEADER)
      .attach('imagen', Buffer.from('fake-png-bytes'), { filename: 'card.png', contentType: 'image/png' });

    const download = await request(app).get(`/imagenes/${participantId}.png?token=${testEnv.INTEGRATIONS_API_TOKEN}`);
    expect(download.status).toBe(200);

    const noToken = await request(app).get(`/imagenes/${participantId}.png`);
    expect(noToken.status).toBe(401);
  });

  it('still requires the header for /datos, rejecting a token passed only as a query string', async () => {
    const app = createApp(testEnv, new FakeDb());
    const response = await request(app).get(`/datos?token=${testEnv.INTEGRATIONS_API_TOKEN}`);
    expect(response.status).toBe(401);
  });
});
