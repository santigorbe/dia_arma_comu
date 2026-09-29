import express from 'express';
import type { AppEnv } from './config/env.js';
import type { Queryable } from './db/pool.js';
import { createHealthRoutes } from './modules/health/healthRoutes.js';
import { createPublicRoutes } from './modules/public/publicRoutes.js';
import { createAdminRoutes } from './modules/admin/adminRoutes.js';
import { createGreetingsRoutes } from './modules/greetings/greetingsRoutes.js';
import { errorHandler, notFoundHandler, requestIdMiddleware } from './shared/http/errors.js';
import { securityMiddleware } from './shared/http/security.js';

export function createApp(env: AppEnv, db: Queryable): express.Express {
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', 1);
  app.use(requestIdMiddleware);
  app.use(securityMiddleware(env));

  app.use('/health', createHealthRoutes(db));
  app.use('/api/public', createPublicRoutes(env, db));
  app.use('/api/admin', createAdminRoutes(env, db));
  app.use('/', createGreetingsRoutes(env, db));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
