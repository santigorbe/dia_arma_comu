import type { Router } from 'express';
import { Router as createRouter } from 'express';
import type { AppEnv } from '../../config/env.js';
import type { Queryable } from '../../db/pool.js';
import { rateLimit } from '../../shared/http/rateLimits.js';
import { createEventRoutes } from './eventRoutes.js';
import { createRegistrationRoutes } from '../registration/registrationRoutes.js';
import { createVisitRoutes } from '../visits/visitRoutes.js';

export function createPublicRoutes(env: AppEnv, db: Queryable): Router {
  const router = createRouter();
  router.use(createEventRoutes(db));
  router.use('/visits', rateLimit('visits'), createVisitRoutes(db));
  router.use('/registrations', rateLimit('registration'), createRegistrationRoutes(env, db));
  return router;
}
