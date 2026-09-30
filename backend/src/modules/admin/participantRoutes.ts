import fs from 'node:fs';
import path from 'node:path';
import { Router } from 'express';
import { z } from 'zod';
import type { AppEnv } from '../../config/env.js';
import type { Queryable } from '../../db/pool.js';
import { withinTransaction } from '../../db/transaction.js';
import { AppError } from '../../shared/http/errors.js';
import { validateRequest } from '../../shared/http/validation.js';
import { requireAdminMutation, type AdminRequest } from './auth.js';
import { deleteParticipantByEmail } from './participantDeletionRepository.js';

const deleteParticipantSchema = z.object({
  email: z.string().trim().email().max(254).transform((value) => value.toLowerCase())
}).strict();

export function createParticipantRoutes(env: AppEnv, db: Queryable): Router {
  const router = Router();

  router.get('/participants', async (_request, response, next) => {
    try {
      const participants = await db.query(
        `SELECT id, full_name AS "fullName", email, phone, personnel_type AS "personnelType", military_rank AS "militaryRank", service_status AS "serviceStatus", created_at AS "createdAt"
         FROM participants
         ORDER BY created_at DESC, id ASC`
      );
      response.json({ participants: participants.rows });
    } catch (error) {
      next(error);
    }
  });

  router.delete('/participants/by-email', requireAdminMutation(env), validateRequest({ body: deleteParticipantSchema }), async (request: AdminRequest, response, next) => {
    try {
      const participant = await withinTransaction(db, (transaction) => deleteParticipantByEmail(transaction, request.body.email, request.admin!.sub));
      if (!participant) throw new AppError(404, 'participant_not_found');

      await removeCardImage(env.CARD_STORAGE_DIR, participant.card_image_filename);
      response.status(204).end();
    } catch (error) {
      next(error);
    }
  });

  return router;
}

async function removeCardImage(storageDirectory: string, filename: string | null): Promise<void> {
  if (!filename || path.basename(filename) !== filename) return;

  try {
    await fs.promises.unlink(path.join(storageDirectory, filename));
  } catch (error: unknown) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
  }
}
