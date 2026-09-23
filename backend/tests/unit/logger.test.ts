import { describe, expect, it } from 'vitest';
import { redact } from '../../src/shared/logging/logger.js';

describe('least-data logging', () => {
  it('redacts credentials, tokens, cookies, personal payloads, and message bodies', () => {
    expect(redact({ password: 'pw', jwt: 'token', cookie: 'c', fullName: 'Person', email: 'p@example.test', messageBody: 'body', publicId: 'safe' })).toEqual({
      password: '[REDACTED]',
      jwt: '[REDACTED]',
      cookie: '[REDACTED]',
      fullName: '[REDACTED]',
      email: '[REDACTED]',
      messageBody: '[REDACTED]',
      publicId: 'safe'
    });
  });
});
