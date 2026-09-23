import type { Queryable } from '../../db/pool.js';
import type { RegistrationRequest } from './registrationSchemas.js';

export async function findIdempotency(db: Queryable, key: string) {
  const result = await db.query('SELECT response_status, response_body FROM idempotency_records WHERE scope = $1 AND idempotency_key = $2', [
    'registration',
    key
  ]);
  return result.rows[0] as { response_status: number; response_body: unknown } | undefined;
}

export async function saveIdempotency(db: Queryable, key: string, status: number, body: unknown) {
  await db.query(
    `INSERT INTO idempotency_records (scope, idempotency_key, response_status, response_body)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (scope, idempotency_key) DO NOTHING`,
    ['registration', key, status, body]
  );
}

export async function findActiveConsent(db: Queryable) {
  const result = await db.query('SELECT version, display_text FROM consent_versions WHERE is_active = true LIMIT 1', []);
  return result.rows[0] as { version: string; display_text: string } | undefined;
}

export async function findParticipantByEmail(db: Queryable, email: string) {
  const result = await db.query('SELECT id, full_name, email, phone, unit_or_organization FROM participants WHERE email = $1 LIMIT 1', [email]);
  return result.rows[0] as Record<string, unknown> | undefined;
}

export async function createParticipantRegistration(db: Queryable, input: RegistrationRequest) {
  const participant = await db.query(
    `INSERT INTO participants (full_name, email, phone, unit_or_organization)
     VALUES ($1, $2, $3, $4)
     RETURNING id`,
    [input.fullName, input.email, input.phone ?? null, input.unitOrOrganization ?? null]
  );
  const participantId = String(participant.rows[0]?.id);
  await db.query(
    `INSERT INTO registration_consents (participant_id, source_visit_id, consent_version, accepted_at)
     VALUES ($1, $2, $3, now())`,
    [participantId, input.visitId, input.consent.version]
  );
  return participantId;
}
