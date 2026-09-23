import request from 'supertest';
import { describe, expect, it, beforeEach } from 'vitest';
import { createApp } from '../../src/app.js';
import { resetRateLimitsForTests } from '../../src/shared/http/rateLimits.js';
import { FakeDb } from '../helpers/fakeDb.js';
import { testEnv } from '../helpers/testEnv.js';

describe('route-class rate limits', () => {
  beforeEach(() => resetRateLimitsForTests());

  it('limits registration independently from public visit initialization', async () => {
    const app = createApp(testEnv, new FakeDb());
    for (let index = 0; index < 10; index += 1) {
      await request(app).post('/api/public/registrations').send({});
    }
    const limited = await request(app).post('/api/public/registrations').send({});
    expect(limited.status).toBe(429);
    expect(limited.headers['retry-after']).toBeDefined();

    const visit = await request(app).post('/api/public/visits/init').send({});
    expect(visit.status).toBe(200);
  });
});
