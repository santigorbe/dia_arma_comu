import type { Queryable } from '../../db/pool.js';
import { withinTransaction } from '../../db/transaction.js';
import { AppError } from '../../shared/http/errors.js';
import type { RegistrationRequest } from './registrationSchemas.js';
import { createParticipantRegistration, enqueueAutomaticDiplomaDelivery, findIdempotency, findParticipantByEmail, saveIdempotency } from './registrationRepository.js';

export async function registerParticipant(db: Queryable, input: RegistrationRequest) {
  const replay = await findIdempotency(db, input.requestIdempotencyKey);
  if (replay) {
    return { status: replay.response_status, body: replay.response_body };
  }

  return withinTransaction(db, async (transaction) => {
    const existing = await findParticipantByEmail(transaction, input.email);
    if (existing) {
      const sameIdentity = existing.full_name === input.fullName;
      if (!sameIdentity) {
        throw new AppError(409, 'participant_conflict');
      }
    }

    const participantId = existing ? String(existing.id) : await createParticipantRegistration(transaction, input);
    if (!existing) {
      await enqueueAutomaticDiplomaDelivery(transaction, participantId, input);
    }
    const body = { participantId, status: 'registered' };
    await saveIdempotency(transaction, input.requestIdempotencyKey, 201, body);
    return { status: 201, body };
  });
}
