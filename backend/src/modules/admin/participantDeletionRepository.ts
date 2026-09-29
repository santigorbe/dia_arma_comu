import type { Queryable } from '../../db/pool.js';
import { appendAuditEvent } from '../../shared/audit/auditRepository.js';

type DeletedParticipant = {
  id: string;
  card_image_filename: string | null;
};

export async function deleteParticipantByEmail(db: Queryable, email: string, adminId: string): Promise<DeletedParticipant | undefined> {
  const participantResult = await db.query(
    'SELECT id, card_image_filename FROM participants WHERE email = $1 LIMIT 1 FOR UPDATE',
    [email]
  );
  const participant = participantResult.rows[0] as DeletedParticipant | undefined;
  if (!participant) return undefined;

  await db.query('DELETE FROM certificate_events WHERE certificate_id IN (SELECT id FROM certificates WHERE participant_id = $1)', [participant.id]);
  await db.query('DELETE FROM certificates WHERE participant_id = $1', [participant.id]);
  await db.query('DELETE FROM diploma_delivery_attempts WHERE delivery_id IN (SELECT id FROM diploma_deliveries WHERE participant_id = $1)', [participant.id]);
  await db.query('DELETE FROM diploma_deliveries WHERE participant_id = $1', [participant.id]);
  await db.query('DELETE FROM communication_attempts WHERE job_id IN (SELECT id FROM communication_jobs WHERE recipient_ref = $1)', [email]);
  await db.query('DELETE FROM communication_jobs WHERE recipient_ref = $1', [email]);
  await db.query('DELETE FROM registration_consents WHERE participant_id = $1', [participant.id]);
  await db.query("DELETE FROM idempotency_records WHERE scope = 'registration' AND response_body ->> 'participantId' = $1", [participant.id]);
  await db.query('DELETE FROM participants WHERE id = $1', [participant.id]);
  await appendAuditEvent(db, {
    actorType: 'admin',
    actorId: adminId,
    action: 'admin.participant.delete',
    targetType: 'participant',
    targetId: participant.id,
    outcome: 'success'
  });

  return participant;
}
