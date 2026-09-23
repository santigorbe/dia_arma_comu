import { describe, expect, it } from 'vitest';
import { AppError, assertSafeClientBody, safeErrorBody } from '../../src/shared/http/errors.js';

describe('safe error responses', () => {
  it('include correlation IDs and safe codes for expected errors', () => {
    const body = safeErrorBody(new AppError(400, 'validation_failed', 'raw message', [{ field: 'name', code: 'too_small' }]), 'req-1');
    expect(body).toEqual({ error: 'validation_failed', requestId: 'req-1', details: [{ field: 'name', code: 'too_small' }] });
  });

  it('does not expose stack traces, SQL, credentials, tokens, cookies, or private records', () => {
    const body = safeErrorBody(new Error('SELECT * FROM users with token secret'), 'req-2');
    expect(body).toEqual({ error: 'internal_error', requestId: 'req-2' });
    expect(() => assertSafeClientBody(body)).not.toThrow();
  });
});
