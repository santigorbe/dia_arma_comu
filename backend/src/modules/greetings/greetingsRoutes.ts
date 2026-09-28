import fs from 'node:fs';
import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import type { AppEnv } from '../../config/env.js';
import type { Queryable } from '../../db/pool.js';
import { AppError } from '../../shared/http/errors.js';
import { rateLimit } from '../../shared/http/rateLimits.js';
import { uuidSchema, validateRequest } from '../../shared/http/validation.js';
import { requireIntegrationToken, requireIntegrationTokenFromHeaderOrQuery } from './greetingsAuth.js';
import { findParticipantById, listParticipantsWithPhone, setCardImage } from './greetingsRepository.js';

const FILENAME_PATTERN = /^[a-zA-Z0-9_-]+\.(png|jpg|jpeg)$/;
const MIME_TO_EXTENSION: Record<string, string> = { 'image/png': 'png', 'image/jpeg': 'jpg' };

const filenameParamSchema = z.object({ filename: z.string().regex(FILENAME_PATTERN) });
const participantIdParamSchema = z.object({ participantId: uuidSchema });

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_request, file, callback) => {
    callback(null, Object.prototype.hasOwnProperty.call(MIME_TO_EXTENSION, file.mimetype));
  }
});

export function createGreetingsRoutes(env: AppEnv, db: Queryable): Router {
  fs.mkdirSync(env.CARD_STORAGE_DIR, { recursive: true });

  const router = Router();
  const guard = [rateLimit('integration'), requireIntegrationToken(env)];

  router.get('/datos', ...guard, async (_request, response, next) => {
    try {
      const participants = await listParticipantsWithPhone(db);
      response.json(
        participants.map((participant) => ({
          nombre: participant.full_name,
          grado: participant.military_rank,
          numero: participant.phone,
          imagen: participant.card_image_filename ? `${env.PUBLIC_BASE_URL}/imagenes/${participant.card_image_filename}` : null
        }))
      );
    } catch (error) {
      next(error);
    }
  });

  router.get(
    '/imagenes/:filename',
    rateLimit('integration'),
    requireIntegrationTokenFromHeaderOrQuery(env),
    validateRequest({ params: filenameParamSchema }),
    (request, response) => {
      response.sendFile(request.params.filename, { root: env.CARD_STORAGE_DIR }, (error) => {
        if (error) response.status(404).json({ error: 'not_found' });
      });
    }
  );

  router.post(
    '/imagenes/:participantId',
    ...guard,
    validateRequest({ params: participantIdParamSchema }),
    upload.single('imagen'),
    async (request, response, next) => {
      try {
        if (!request.file) throw new AppError(400, 'imagen_required');
        const participant = await findParticipantById(db, request.params.participantId);
        if (!participant) throw new AppError(404, 'participant_not_found');

        const extension = MIME_TO_EXTENSION[request.file.mimetype];
        const filename = `${participant.id}.${extension}`;
        await fs.promises.writeFile(`${env.CARD_STORAGE_DIR}/${filename}`, request.file.buffer);
        await setCardImage(db, participant.id, filename);

        response.status(201).json({ imagen: `${env.PUBLIC_BASE_URL}/imagenes/${filename}` });
      } catch (error) {
        next(error);
      }
    }
  );

  return router;
}
