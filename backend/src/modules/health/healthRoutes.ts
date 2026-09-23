import { Router } from 'express';
import type { Queryable } from '../../db/pool.js';
import { checkDatabaseReady } from '../../db/health.js';

export function createHealthRoutes(db: Queryable): Router {
  const router = Router();

  router.get('/live', (_request, response) => {
    response.json({ status: 'live' });
  });

  router.get('/ready', async (_request, response) => {
    const readiness = await checkDatabaseReady(db);
    response.status(readiness.ready ? 200 : 503).json({ status: readiness.ready ? 'ready' : 'not_ready', checks: readiness.checks });
  });

  return router;
}
