import type { Queryable } from '../../db/pool.js';
import { readPublishedSchedule } from '../public/publicRepository.js';
import { createLogger, type LogRecord } from '../../shared/logging/logger.js';
import type { EmailProvider } from './emailProvider.js';
import { renderRegistrationConfirmation } from './registrationConfirmation.js';

type ClaimedJob = { id: string; recipient_ref: string; attempts: number };

export async function processNextCommunicationJob(db: Queryable, provider: EmailProvider, workerId: string, writeLog: (record: LogRecord) => void = console.info): Promise<boolean> {
  const job = await claimDueRegistrationEmail(db, workerId);
  if (!job) return false;

  const logger = createLogger(writeLog);
  try {
    const schedule = await readPublishedSchedule(db);
    const email = renderRegistrationConfirmation(job.recipient_ref, schedule);
    const result = await provider.send(email);
    await recordDelivered(db, job, provider.mode, result.providerId);
    logger.info('Communication job delivered', { jobId: job.id, attempt: job.attempts, providerMode: provider.mode });
  } catch (error) {
    const errorCode = error instanceof Error && /^brevo_\d+$/.test(error.message) ? error.message : 'delivery_failed';
    await recordFailure(db, job, provider.mode, errorCode);
    logger.error('Communication job delivery failed', { jobId: job.id, attempt: job.attempts, errorCode, providerMode: provider.mode });
  }
  return true;
}

async function claimDueRegistrationEmail(db: Queryable, workerId: string): Promise<ClaimedJob | undefined> {
  const result = await db.query(
    `WITH candidate AS (
       SELECT id FROM communication_jobs
       WHERE channel = $1 AND message_key = $2 AND state IN ('pending', 'retryable_failed') AND next_attempt_at <= now()
       ORDER BY next_attempt_at ASC, created_at ASC
       FOR UPDATE SKIP LOCKED
       LIMIT 1
     )
     UPDATE communication_jobs AS job
     SET state = $3, attempts = attempts + 1, claimed_by = $4, claimed_until = now() + interval '5 minutes', updated_at = now()
     FROM candidate WHERE job.id = candidate.id
     RETURNING job.id, job.recipient_ref, job.attempts`,
    ['email', 'registration-confirmation', 'processing', workerId]
  );
  return result.rows[0] as ClaimedJob | undefined;
}

async function recordDelivered(db: Queryable, job: ClaimedJob, providerMode: EmailProvider['mode'], providerId?: string) {
  await db.query(
    `INSERT INTO communication_attempts (job_id, attempt_number, provider_mode, outcome, sanitized_summary)
     VALUES ($1, $2, $3, $4, $5)`,
    [job.id, job.attempts, providerMode, 'delivered', JSON.stringify({ providerId: providerId ?? null })]
  );
  await db.query(
    `UPDATE communication_jobs SET state = $1, claimed_by = NULL, claimed_until = NULL, last_error_code = NULL, provider_result = $2, updated_at = now() WHERE id = $3`,
    ['delivered', JSON.stringify({ providerId: providerId ?? null }), job.id]
  );
}

async function recordFailure(db: Queryable, job: ClaimedJob, providerMode: EmailProvider['mode'], errorCode: string) {
  const state = job.attempts >= 3 ? 'terminal_failed' : 'retryable_failed';
  await db.query(
    `INSERT INTO communication_attempts (job_id, attempt_number, provider_mode, outcome, sanitized_summary)
     VALUES ($1, $2, $3, $4, $5)`,
    [job.id, job.attempts, providerMode, 'failed', JSON.stringify({ errorCode })]
  );
  await db.query(
    `UPDATE communication_jobs
     SET state = $1, claimed_by = NULL, claimed_until = NULL, last_error_code = $2,
         next_attempt_at = now() + ($3 * interval '1 minute'), updated_at = now()
     WHERE id = $4`,
    [state, errorCode, job.attempts, job.id]
  );
}
