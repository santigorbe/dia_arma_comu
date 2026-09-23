import crypto from 'node:crypto';
import type { Queryable } from '../../db/pool.js';
import { uuidSchema } from '../../shared/http/validation.js';
import { touchVisit } from './visitRepository.js';

export async function initializeVisit(db: Queryable, presentedVisitId?: unknown) {
  const parsed = typeof presentedVisitId === 'string' ? uuidSchema.safeParse(presentedVisitId) : undefined;
  const visitId = parsed?.success ? parsed.data : crypto.randomUUID();
  await touchVisit(db, visitId);
  return { visitId, replaced: Boolean(presentedVisitId && !parsed?.success) };
}
