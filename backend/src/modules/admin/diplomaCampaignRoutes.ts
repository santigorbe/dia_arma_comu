import { Router } from 'express';
import { z } from 'zod';
import { withinTransaction } from '../../db/transaction.js';
import type { Queryable } from '../../db/pool.js';
import { audit, type AdminRequest } from './auth.js';
import { createDiplomaCampaign } from '../diplomas/diplomaCampaignRepository.js';
import { AppError } from '../../shared/http/errors.js';

const createCampaignSchema = z.object({}).strict();

export function createDiplomaCampaignRoutes(db: Queryable): Router {
  const router = Router();
  router.post('/diploma-campaigns', async (request: AdminRequest, response, next) => {
    try {
      createCampaignSchema.parse(request.body);
      const campaign = await withinTransaction(db, (transaction) => createDiplomaCampaign(transaction, request.admin!.sub));
      await audit(db, request.admin!.sub, 'admin.diploma_campaign.create', 'diploma_campaign', campaign.id, 'success');
      response.status(201).json({ campaign });
    } catch (error) {
      next(error instanceof z.ZodError ? new AppError(400, 'validation_failed', 'validation_failed', { fields: error.flatten().fieldErrors }) : error);
    }
  });

  router.get('/diploma-campaigns', async (_request, response, next) => {
    try {
      const result = await db.query(
        `SELECT c.id, c.state, c.origin, c.audience_count AS "audienceCount", c.created_at AS "createdAt", c.completed_at AS "completedAt",
                count(d.*) FILTER (WHERE d.state = 'delivered')::int AS delivered,
                count(d.*) FILTER (WHERE d.state IN ('pending', 'processing'))::int AS pending,
                count(d.*) FILTER (WHERE d.state = 'retryable_failed')::int AS retrying,
                count(d.*) FILTER (WHERE d.state = 'terminal_failed')::int AS failed
         FROM diploma_campaigns c
         LEFT JOIN diploma_deliveries d ON d.campaign_id = c.id
         WHERE c.origin = 'admin'
         GROUP BY c.id
         ORDER BY c.created_at DESC
         LIMIT 50`
      );
      response.json({ campaigns: result.rows });
    } catch (error) { next(error); }
  });

  router.get('/diploma-campaigns/:id/deliveries', async (request, response, next) => {
    try {
      const id = z.string().uuid().safeParse(request.params.id);
      if (!id.success) throw new AppError(400, 'validation_failed');
      const result = await db.query(
        `SELECT id, recipient_email AS "recipientEmail", participant_name AS "participantName", state, attempts,
                last_error_code AS "lastErrorCode", delivered_at AS "deliveredAt"
         FROM diploma_deliveries WHERE campaign_id = $1 ORDER BY created_at ASC`,
        [id.data]
      );
      response.json({ deliveries: result.rows });
    } catch (error) { next(error); }
  });
  return router;
}
