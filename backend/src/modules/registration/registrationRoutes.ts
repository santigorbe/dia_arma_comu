import type { Router } from 'express';
import { Router as createRouter } from 'express';
import type { AppEnv } from '../../config/env.js';
import type { Queryable } from '../../db/pool.js';
import { validateRequest } from '../../shared/http/validation.js';
import { registrationRequestSchema, registrationValidationDetailAllowlist } from './registrationSchemas.js';
import { registerParticipant } from './registrationService.js';

export function createRegistrationRoutes(env: AppEnv, db: Queryable): Router {
  const router = createRouter();
  router.post('/', validateRequest({ body: registrationRequestSchema }, registrationValidationDetailAllowlist), async (request, response, next) => {
    try {
      const result = await registerParticipant(db, request.body);
      response.status(result.status).json(result.body);
    } catch (error) {
      next(error);
    }
  });
  return router;
}
