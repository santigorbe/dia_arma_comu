import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../../src/app.js';
import { FakeDb } from '../helpers/fakeDb.js';
import { testEnv } from '../helpers/testEnv.js';
import { AppError, safeErrorBody } from '../../src/shared/http/errors.js';

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

  it('projects allowlisted validation details without values or messages', () => {
    const error = new AppError(
      400,
      'validation_failed',
      'validation_failed',
      [
        { field: 'email', code: 'invalid_string', value: 'private@example.test', message: 'private' },
        { field: 'email', code: 'invalid_string' },
        { field: 'unknown', code: 'custom', value: 'secret' }
      ],
      { email: ['invalid_string'] }
    );

    expect(safeErrorBody(error, 'req-1')).toEqual({
      error: 'validation_failed',
      requestId: 'req-1',
      details: [{ field: 'email', code: 'invalid_string' }]
    });
  });
});
