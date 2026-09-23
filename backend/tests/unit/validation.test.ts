import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { AppError } from '../../src/shared/http/errors.js';
import { parseOrThrow } from '../../src/shared/http/validation.js';

describe('request validation helpers', () => {
  it('validates untrusted values before mutation', () => {
    expect(parseOrThrow(z.object({ id: z.string().uuid() }), { id: '550e8400-e29b-41d4-a716-446655440000' })).toEqual({ id: '550e8400-e29b-41d4-a716-446655440000' });
  });

  it('returns safe field-level validation failures', () => {
    expect(() => parseOrThrow(z.object({ id: z.string().uuid() }), { id: 'not-a-uuid' })).toThrow(AppError);
  });
});
