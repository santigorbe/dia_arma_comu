import { Router } from 'express';
import jwt from 'jsonwebtoken';
import type { AppEnv } from '../../config/env.js';
import type { Queryable } from '../../db/pool.js';
import { authCookieOptions } from '../../shared/http/security.js';
import { rateLimit } from '../../shared/http/rateLimits.js';
import { AppError } from '../../shared/http/errors.js';
import { authenticate, audit, issueSession, loginSchema, requireAdmin, requireAdminMutation, type AdminRequest } from './auth.js';
import { createManagementRoutes } from './managementRoutes.js';
import { createDiplomaCampaignRoutes } from './diplomaCampaignRoutes.js';
import { createParticipantRoutes } from './participantRoutes.js';

export function createAdminRoutes(env: AppEnv, db: Queryable): Router {
  const router = Router();
  router.post('/session', rateLimit('login'), async (request, response, next) => {
    try {
      const input = loginSchema.parse(request.body);
      const admin = await authenticate(db, input.identifier, input.password);
      if (!admin) { await audit(db, undefined, 'admin.login', 'session', input.identifier, 'failure'); throw new AppError(401, 'invalid_credentials'); }
      const { token } = issueSession(env, admin.id);
      response.cookie(env.AUTH_COOKIE_NAME, token, authCookieOptions(env));
      await audit(db, admin.id, 'admin.login', 'session', admin.id, 'success');
      response.status(204).end();
    } catch (error) { next(error); }
  });
  router.use(requireAdmin(env, db));
  router.get('/session', (request: AdminRequest, response) => response.json({ admin: { id: request.admin!.sub } }));
  router.post('/logout', requireAdminMutation(env), async (request: AdminRequest, response, next) => {
    try {
      const token = request.cookies[env.AUTH_COOKIE_NAME] as string;
      const claims = jwt.decode(token) as jwt.JwtPayload;
      await db.query('INSERT INTO admin_token_invalidations (jwt_id, admin_id, expires_at) VALUES ($1, $2, to_timestamp($3)) ON CONFLICT (jwt_id) DO NOTHING', [request.admin!.jti, request.admin!.sub, claims.exp]);
      const { maxAge: _maxAge, ...clearCookieOptions } = authCookieOptions(env);
      response.clearCookie(env.AUTH_COOKIE_NAME, clearCookieOptions);
      await audit(db, request.admin!.sub, 'admin.logout', 'session', request.admin!.sub!, 'success');
      response.status(204).end();
    } catch (error) { next(error); }
  });
  router.use(requireAdminMutation(env));
  router.use(createDiplomaCampaignRoutes(db));
  router.use(createParticipantRoutes(env, db));
  router.use(createManagementRoutes(db));
  return router;
}
