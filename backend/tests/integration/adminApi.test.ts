import bcrypt from 'bcrypt';
import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../../src/app.js';
import { resetRateLimitsForTests } from '../../src/shared/http/rateLimits.js';
import { FakeDb } from '../helpers/fakeDb.js';
import { testEnv } from '../helpers/testEnv.js';

const password = 'correct-horse-battery-staple';
const origin = testEnv.FRONTEND_ORIGIN;

async function authenticatedAdmin() {
  const db = new FakeDb();
  db.admins.set('operator', { id: 'admin-1', password_hash: await bcrypt.hash(password, 4), is_active: true });
  const agent = request.agent(createApp(testEnv, db));
  const login = await agent.post('/api/admin/session').send({ identifier: 'operator', password });
  return { agent, db, login };
}

describe('administrative API contracts', () => {
  beforeEach(() => resetRateLimitsForTests());

  it('rejects invalid credentials and exposes no session token to the response body', async () => {
    const db = new FakeDb();
    const response = await request(createApp(testEnv, db)).post('/api/admin/session').send({ identifier: 'unknown', password });

    expect(response.status).toBe(401);
    expect(response.body).toMatchObject({ error: 'invalid_credentials' });
    expect(response.headers['set-cookie']).toBeUndefined();
    expect(db.audits).toHaveLength(1);
  });

  it('creates an HttpOnly cookie session, protects routes, validates origins, and invalidates logout sessions', async () => {
    const { agent, db, login } = await authenticatedAdmin();

    expect(login.status).toBe(204);
    expect(login.headers['set-cookie']?.[0]).toMatch(/Path=\/api\/admin;.*HttpOnly;.*SameSite=Lax/i);
    const sessionCookie = login.headers['set-cookie']![0].split(';')[0];
    expect((await request(createApp(testEnv, db)).get('/api/admin/session')).status).toBe(401);
    await expect(agent.get('/api/admin/session')).resolves.toMatchObject({ status: 200, body: { admin: { id: 'admin-1' } } });
    await expect(agent.post('/api/admin/content').send({ contentKey: 'hero', title: 'Hero', body: 'Body' })).resolves.toMatchObject({ status: 403, body: { error: 'invalid_origin' } });
    await expect(agent.post('/api/admin/logout').set('Origin', origin)).resolves.toMatchObject({ status: 204 });
    await expect(request(createApp(testEnv, db)).get('/api/admin/session').set('Cookie', sessionCookie)).resolves.toMatchObject({ status: 401, body: { error: 'invalid_session' } });
    await expect(agent.get('/api/admin/session')).resolves.toMatchObject({ status: 401, body: { error: 'authentication_required' } });
    expect(db.audits).toHaveLength(2);
  });

  it.each([
    ['content', { contentKey: 'hero', title: 'Hero', body: 'Welcome' }],
    ['schedule', { title: 'Opening', description: 'Introduction', startsAt: '2026-09-29T09:00:00.000Z', endsAt: '2026-09-29T10:00:00.000Z', location: 'Hall' }],
    ['map', { label: 'Main entrance', description: 'Step-free access', latitude: -34.6, longitude: -58.4 }]
  ])('creates, updates, publishes, lists, and deletes %s with version control and audit events', async (resource, input) => {
    const { agent, db } = await authenticatedAdmin();
    const create = await agent.post(`/api/admin/${resource}`).set('Origin', origin).send(input);

    expect(create.status).toBe(201);
    expect(create.body.item).toMatchObject({ state: 'draft', version: 1 });
    const id = create.body.item.id as string;
    const update = await agent.put(`/api/admin/${resource}/${id}`).set('Origin', origin).send({ ...input, version: 1 });
    expect(update.body.item).toMatchObject({ id, version: 2 });
    const conflict = await agent.post(`/api/admin/${resource}/${id}/publish`).set('Origin', origin).send({ version: 1 });
    expect(conflict).toMatchObject({ status: 409, body: { error: 'version_conflict' } });
    const publish = await agent.post(`/api/admin/${resource}/${id}/publish`).set('Origin', origin).send({ version: 2 });
    expect(publish.body.item).toMatchObject({ id, state: 'published', version: 3, publishedAt: expect.any(String) });
    const list = await agent.get(`/api/admin/${resource}`).set('Origin', origin);
    expect(list.status).toBe(200);
    const deletion = await agent.delete(`/api/admin/${resource}/${id}`).set('Origin', origin).send({ version: 3 });
    expect(deletion.status).toBe(204);
    expect(db.audits).toHaveLength(5);
  });

  it('creates an audited diploma campaign with an immutable participant and rank snapshot', async () => {
    const { agent, db } = await authenticatedAdmin();
    db.participants.set('military@example.test', { id: 'participant-1', full_name: 'Military Participant', email: 'military@example.test', military_rank: 'Captain' });
    db.participants.set('civilian@example.test', { id: 'participant-2', full_name: 'Civilian Participant', email: 'civilian@example.test', military_rank: null });

    const response = await agent.post('/api/admin/diploma-campaigns').set('Origin', origin).send({});

    expect(response).toMatchObject({ status: 201, body: { campaign: { state: 'queued', audienceCount: 2 } } });
    expect(db.diplomaDeliveries).toEqual(expect.arrayContaining([
      expect.objectContaining({ participant_id: 'participant-1', military_rank: 'Captain' }),
      expect.objectContaining({ participant_id: 'participant-2', military_rank: 'NA' })
    ]));
    expect(db.audits).toHaveLength(2);
  });

  it('rejects unauthenticated, cross-origin, and malformed diploma campaign requests', async () => {
    expect((await request(createApp(testEnv, new FakeDb())).post('/api/admin/diploma-campaigns').send({})).status).toBe(401);
    const { agent } = await authenticatedAdmin();
    expect((await agent.post('/api/admin/diploma-campaigns').send({})).status).toBe(403);
    expect(await agent.post('/api/admin/diploma-campaigns').set('Origin', origin).send({ unexpected: true })).toMatchObject({ status: 400, body: { error: 'validation_failed' } });
  });
});
