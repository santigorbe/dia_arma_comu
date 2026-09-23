import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../../src/app.js';
import { FakeDb } from '../helpers/fakeDb.js';
import { testEnv } from '../helpers/testEnv.js';

describe('centralized error handling', () => {
  it('returns correlation IDs and hides diagnostics for unexpected failures', async () => {
    const response = await request(createApp(testEnv, new FakeDb())).get('/missing-route').set('x-request-id', 'visible-request-id');
    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'not_found', requestId: 'visible-request-id' });
    expect(JSON.stringify(response.body)).not.toMatch(/stack|SELECT|secret|token|cookie|email|phone/i);
  });

  it('rejects unknown credentialed origins without wildcard CORS access', async () => {
    const response = await request(createApp(testEnv, new FakeDb())).post('/api/public/visits/init').set('origin', 'https://unknown.example').send({});
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('origin_not_allowed');
    expect(response.headers['access-control-allow-origin']).toBeUndefined();
  });
});
