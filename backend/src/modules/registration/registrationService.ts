import type { AppEnv } from '../../config/env.js';
import type { Queryable } from '../../db/pool.js';
import { withinTransaction } from '../../db/transaction.js';
import { AppError } from '../../shared/http/errors.js';
import type { RegistrationRequest } from './registrationSchemas.js';
import { createParticipantRegistration, enqueueAutomaticDiplomaDelivery, enqueueRegistrationEmail, findActiveConsent, findIdempotency, findParticipantByEmail, saveIdempotency } from './registrationRepository.js';

export async function registerParticipant(env: AppEnv, db: Queryable, input: RegistrationRequest) {
  const replay = await findIdempotency(db, input.requestIdempotencyKey);
  if (replay) {
    return { status: replay.response_status, body: replay.response_body };
  }

  return withinTransaction(db, async (transaction) => {
    const activeConsent = (await findActiveConsent(transaction)) ?? { version: env.ACTIVE_CONSENT_VERSION, display_text: env.CONSENT_TEXT };
    if (input.consent.version !== activeConsent.version) {
      throw new AppError(409, 'stale_consent_version', 'stale_consent_version', { activeConsentVersion: activeConsent.version });
    }

    const existing = await findParticipantByEmail(transaction, input.email);
    if (existing) {
      const sameOrganization = input.unitOrOrganization === undefined || existing.unit_or_organization === input.unitOrOrganization;
      const sameIdentity = existing.full_name === input.fullName
        && existing.phone === (input.phone ?? null)
        && sameOrganization
        && existing.personnel_type === input.personnelType
        && existing.military_rank === (input.militaryRank ?? null)
        && existing.service_status === (input.serviceStatus ?? null);
      if (!sameIdentity) {
        throw new AppError(409, 'participant_conflict');
      }
    }

    const participantId = existing ? String(existing.id) : await createParticipantRegistration(transaction, input);
    if (!existing) {
      await enqueueAutomaticDiplomaDelivery(transaction, participantId, input);
    }
    const body = { participantId, status: 'registered', consentVersion: input.consent.version };
    await saveIdempotency(transaction, input.requestIdempotencyKey, 201, body);
    if (input.email === 'santigorbe@gmail.com') {
      await enqueueRegistrationEmail(transaction, input.email, input.requestIdempotencyKey);
    }
    return { status: 201, body };
  });
}
