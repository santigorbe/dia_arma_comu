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
    personnelType: z.enum(['militar', 'civil']),
    militaryRank: z.string().trim().min(1).max(60).optional(),
    serviceStatus: z.enum(['actividad', 'retiro']).optional(),
    consent: z.object({ accepted: z.literal(true), version: z.string().min(1).max(80) }).strict()
  })
  .strict()
  .superRefine((value, ctx) => {
    if (value.personnelType === 'militar' && !value.militaryRank) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'militaryRank is required when personnelType is militar', path: ['militaryRank'] });
    }
    if (value.personnelType === 'civil' && value.militaryRank !== undefined) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'militaryRank must not be provided when personnelType is civil', path: ['militaryRank'] });
    }
    if (value.personnelType === 'militar' && !value.serviceStatus) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'serviceStatus is required when personnelType is militar', path: ['serviceStatus'] });
    }
    if (value.personnelType === 'civil' && value.serviceStatus !== undefined) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'serviceStatus must not be provided when personnelType is civil', path: ['serviceStatus'] });
    }
  });

export type RegistrationRequest = z.infer<typeof registrationRequestSchema>;
