import crypto from 'node:crypto';
import type { Queryable } from '../../db/pool.js';
import { createLogger, type LogRecord } from '../../shared/logging/logger.js';
import type { EmailProvider } from '../communications/emailProvider.js';
import type { DiplomaGenerator } from './diplomaGenerator.js';

type ClaimedDelivery = { id: string; campaign_id: string; recipient_email: string; participant_name: string; diploma_grade: string; attempts: number };

export async function processNextDiplomaDelivery(db: Queryable, provider: EmailProvider, generator: DiplomaGenerator, workerId: string, writeLog: (record: LogRecord) => void = console.info): Promise<boolean> {
  const delivery = await claimDueDiplomaDelivery(db, workerId);
  if (!delivery) return false;
  const logger = createLogger(writeLog);
  try {
    const pdf = await generator.generate({ fullName: delivery.participant_name, grade: delivery.diploma_grade });
    const result = await provider.send({
      to: delivery.recipient_email,
      subject: 'Salutación por el 84° Aniversario del Arma de Comunicaciones y el Dia del Sistema de Computaciónde de Datos',
      text: 'Salutación por el 84° Aniversario del Arma de Comunicaciones y el Dia del Sistema de Computaciónde de Datos',
      attachments: [{ name: 'Salutacion - DCEA.pdf', content: pdf }]
    });
    await recordDelivery(db, delivery, provider.mode, crypto.createHash('sha256').update(pdf).digest('hex'), result.providerId);
    logger.info('Diploma delivery completed', { deliveryId: delivery.id, attempt: delivery.attempts, providerMode: provider.mode });
  } catch (error) {
    const errorCode = error instanceof Error && /^brevo_\d+$/.test(error.message) ? error.message : 'diploma_delivery_failed';
    await recordFailure(db, delivery, provider.mode, errorCode);
    logger.error('Diploma delivery failed', { deliveryId: delivery.id, attempt: delivery.attempts, errorCode, providerMode: provider.mode });
  }
  return true;
}

async function claimDueDiplomaDelivery(db: Queryable, workerId: string): Promise<ClaimedDelivery | undefined> {
  const result = await db.query(
    `WITH candidate AS (
       SELECT id FROM diploma_deliveries
       WHERE (state IN ('pending', 'retryable_failed') AND next_attempt_at <= now())
          OR (state = 'processing' AND claimed_until <= now())
       ORDER BY next_attempt_at ASC, created_at ASC FOR UPDATE SKIP LOCKED LIMIT 1
     )
     UPDATE diploma_deliveries AS delivery
     SET state = 'processing', attempts = attempts + 1, claimed_by = $1, claimed_until = now() + interval '5 minutes', updated_at = now()
     FROM candidate WHERE delivery.id = candidate.id
      RETURNING delivery.id, delivery.campaign_id, delivery.recipient_email, delivery.participant_name, delivery.diploma_grade, delivery.attempts`,
    [workerId]
  );
  const delivery = result.rows[0] as ClaimedDelivery | undefined;
  if (delivery) await db.query(`UPDATE diploma_campaigns SET state = 'processing', started_at = COALESCE(started_at, now()) WHERE id = $1`, [delivery.campaign_id]);
  return delivery;
}

async function recordDelivery(db: Queryable, delivery: ClaimedDelivery, providerMode: EmailProvider['mode'], pdfSha256: string, providerId?: string) {
  await db.query(`INSERT INTO diploma_delivery_attempts (delivery_id, attempt_number, provider_mode, outcome, sanitized_summary) VALUES ($1, $2, $3, 'delivered', $4)`, [delivery.id, delivery.attempts, providerMode, JSON.stringify({ providerId: providerId ?? null })]);
  await db.query(`UPDATE diploma_deliveries SET state = 'delivered', claimed_by = NULL, claimed_until = NULL, last_error_code = NULL, provider_result = $1, pdf_sha256 = $2, delivered_at = now(), updated_at = now() WHERE id = $3`, [JSON.stringify({ providerId: providerId ?? null }), pdfSha256, delivery.id]);
  await aggregateCampaign(db, delivery.campaign_id);
}

async function recordFailure(db: Queryable, delivery: ClaimedDelivery, providerMode: EmailProvider['mode'], errorCode: string) {
  const state = delivery.attempts >= 3 ? 'terminal_failed' : 'retryable_failed';
  await db.query(`INSERT INTO diploma_delivery_attempts (delivery_id, attempt_number, provider_mode, outcome, sanitized_summary) VALUES ($1, $2, $3, 'failed', $4)`, [delivery.id, delivery.attempts, providerMode, JSON.stringify({ errorCode })]);
  await db.query(`UPDATE diploma_deliveries SET state = $1, claimed_by = NULL, claimed_until = NULL, last_error_code = $2, next_attempt_at = now() + ($3 * interval '1 minute'), updated_at = now() WHERE id = $4`, [state, errorCode, delivery.attempts, delivery.id]);
  await aggregateCampaign(db, delivery.campaign_id);
}

async function aggregateCampaign(db: Queryable, campaignId: string) {
  await db.query(
    `UPDATE diploma_campaigns AS campaign
     SET state = CASE WHEN EXISTS (SELECT 1 FROM diploma_deliveries WHERE campaign_id = campaign.id AND state IN ('pending', 'processing', 'retryable_failed')) THEN 'processing'
                      WHEN EXISTS (SELECT 1 FROM diploma_deliveries WHERE campaign_id = campaign.id AND state = 'terminal_failed') THEN 'completed_with_failures'
                      ELSE 'completed' END,
         completed_at = CASE WHEN NOT EXISTS (SELECT 1 FROM diploma_deliveries WHERE campaign_id = campaign.id AND state IN ('pending', 'processing', 'retryable_failed')) THEN now() ELSE NULL END
     WHERE campaign.id = $1`,
    [campaignId]
  );
}
