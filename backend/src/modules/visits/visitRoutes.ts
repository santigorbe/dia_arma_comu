import type { Router } from 'express';
import { Router as createRouter } from 'express';
import { z } from 'zod';
import type { Queryable } from '../../db/pool.js';
import { validateRequest } from '../../shared/http/validation.js';
import { initializeVisit } from './visitService.js';

const initVisitSchema = z.object({ visitId: z.string().optional() }).strict();

export function createVisitRoutes(db: Queryable): Router {
  const router = createRouter();
  router.post('/init', validateRequest({ body: initVisitSchema }), async (request, response, next) => {
    try {
      response.status(200).json(await initializeVisit(db, request.body.visitId));
    } catch (error) {
      next(error);
    }
  });
  return router;
}
