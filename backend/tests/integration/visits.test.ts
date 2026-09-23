import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../../src/app.js';
import { FakeDb } from '../helpers/fakeDb.js';
import { testEnv } from '../helpers/testEnv.js';

describe('anonymous visits', () => {
  it('assigns a first visit UUID without collecting personal data', async () => {
    const db = new FakeDb();
    const response = await request(createApp(testEnv, db)).post('/api/public/visits/init').send({});
    expect(response.status).toBe(200);
    expect(response.body.visitId).toMatch(/^[0-9a-f-]{36}$/);
    expect(JSON.stringify(response.body)).not.toMatch(/name|email|phone/i);
  });

  it('reuses valid UUIDs and replaces malformed identifiers', async () => {
    const app = createApp(testEnv, new FakeDb());
    const valid = '550e8400-e29b-41d4-a716-446655440000';
    const reused = await request(app).post('/api/public/visits/init').send({ visitId: valid });
    expect(reused.body).toEqual({ visitId: valid, replaced: false });

    const replaced = await request(app).post('/api/public/visits/init').send({ visitId: 'bad-id' });
    expect(replaced.body.visitId).not.toBe('bad-id');
    expect(replaced.body.replaced).toBe(true);
  });
});
