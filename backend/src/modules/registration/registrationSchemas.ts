import { z } from 'zod';
import { idempotencyKeySchema, uuidSchema } from '../../shared/http/validation.js';

export const registrationValidationDetailAllowlist = {
  fullName: ['invalid_type', 'too_small', 'too_big'],
  email: ['invalid_type', 'invalid_string', 'too_big']
} as const;

export const registrationRequestSchema = z
  .object({
    requestIdempotencyKey: idempotencyKeySchema,
    visitId: uuidSchema,
    fullName: z.string().trim().min(2).max(120),
    email: z.string().trim().email().max(254).transform((value) => value.toLowerCase())
  })
  .strict();

export type RegistrationRequest = z.infer<typeof registrationRequestSchema>;
