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
  return router;
}
