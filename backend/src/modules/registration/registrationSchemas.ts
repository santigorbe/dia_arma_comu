import { z } from 'zod';
import { idempotencyKeySchema, uuidSchema } from '../../shared/http/validation.js';

export const registrationRequestSchema = z
  .object({
    requestIdempotencyKey: idempotencyKeySchema,
    visitId: uuidSchema,
    fullName: z.string().trim().min(2).max(120),
    email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
    phone: z.string().trim().max(40).optional(),
    unitOrOrganization: z.string().trim().max(120).optional(),
    consent: z.object({ accepted: z.literal(true), version: z.string().min(1).max(80) }).strict()
  })
  .strict();

export type RegistrationRequest = z.infer<typeof registrationRequestSchema>;
