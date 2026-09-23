import type { AppEnv } from '../../config/env.js';
import type { Queryable } from '../../db/pool.js';
import { AppError } from '../../shared/http/errors.js';
import type { RegistrationRequest } from './registrationSchemas.js';
import { createParticipantRegistration, findActiveConsent, findIdempotency, findParticipantByEmail, saveIdempotency } from './registrationRepository.js';

export async function registerParticipant(env: AppEnv, db: Queryable, input: RegistrationRequest) {
  const replay = await findIdempotency(db, input.requestIdempotencyKey);
  if (replay) {
    return { status: replay.response_status, body: replay.response_body };
  }

  const activeConsent = (await findActiveConsent(db)) ?? { version: env.ACTIVE_CONSENT_VERSION, display_text: env.CONSENT_TEXT };
  if (input.consent.version !== activeConsent.version) {
    throw new AppError(409, 'stale_consent_version', 'stale_consent_version', { activeConsentVersion: activeConsent.version });
  }

  const existing = await findParticipantByEmail(db, input.email);
  if (existing) {
    const sameIdentity = existing.full_name === input.fullName && existing.phone === (input.phone ?? null) && existing.unit_or_organization === (input.unitOrOrganization ?? null);
    if (!sameIdentity) {
      throw new AppError(409, 'participant_conflict');
    }
  }

  const participantId = existing ? String(existing.id) : await createParticipantRegistration(db, input);
  const body = { participantId, status: 'registered', consentVersion: input.consent.version };
  await saveIdempotency(db, input.requestIdempotencyKey, 201, body);
  return { status: 201, body };
}
