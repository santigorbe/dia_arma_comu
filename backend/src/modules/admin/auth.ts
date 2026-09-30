import crypto from 'node:crypto';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import type { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import type { AppEnv } from '../../config/env.js';
import type { Queryable } from '../../db/pool.js';
import { appendAuditEvent } from '../../shared/audit/auditRepository.js';
import { AppError } from '../../shared/http/errors.js';

export type AdminClaims = jwt.JwtPayload & { sub: string; jti: string; role: 'admin' };
export type AdminRequest = Request & { admin?: AdminClaims };
export const loginSchema = z.object({ identifier: z.string().trim().min(3).max(160), password: z.string().min(12).max(256) }).strict();

export function issueSession(env: AppEnv, adminId: string) {
  const jti = crypto.randomUUID();
  const token = jwt.sign({ role: 'admin' }, env.JWT_SECRET, { subject: adminId, jwtid: jti, expiresIn: env.AUTH_COOKIE_MAX_AGE_SECONDS, issuer: env.BACKEND_ORIGIN, audience: 'admin' });
  return { token, jti };
}

export async function authenticate(db: Queryable, identifier: string, password: string) {
  const result = await db.query('SELECT id, password_hash, is_active FROM admins WHERE identifier = $1', [identifier]);
  const admin = result.rows[0] as { id: string; password_hash: string; is_active: boolean } | undefined;
  if (!admin || !admin.is_active || !(await bcrypt.compare(password, admin.password_hash))) return undefined;
  return { id: admin.id };
}

export function requireAdmin(env: AppEnv, db: Queryable) {
  return async (request: AdminRequest, _response: Response, next: NextFunction) => {
    try {
      const token = request.cookies?.[env.AUTH_COOKIE_NAME];
      if (!token) throw new AppError(401, 'authentication_required');
      const claims = jwt.verify(token, env.JWT_SECRET, { issuer: env.BACKEND_ORIGIN, audience: 'admin' }) as AdminClaims;
      if (!claims.sub || !claims.jti || claims.role !== 'admin') throw new AppError(401, 'invalid_session');
      const invalidated = await db.query('SELECT jwt_id FROM admin_token_invalidations WHERE jwt_id = $1 AND expires_at > now()', [claims.jti]);
      if (invalidated.rowCount) throw new AppError(401, 'invalid_session');
      const active = await db.query('SELECT id FROM admins WHERE id = $1 AND is_active = true', [claims.sub]);
      if (!active.rowCount) throw new AppError(403, 'administrator_inactive');
      request.admin = claims;
      next();
    } catch (error) {
      next(error instanceof AppError ? error : new AppError(401, 'invalid_session'));
    }
  };
}

export function requireAdminMutation(env: AppEnv) {
  return (request: Request, _response: Response, next: NextFunction) => {
    // Safe methods never mutate state; browsers omit Origin on same-origin GETs.
    if (request.method === 'GET' || request.method === 'HEAD') return next();
    const origin = request.header('origin');
    if (!origin || !env.allowedOrigins.includes(origin)) return next(new AppError(403, 'invalid_origin'));
    next();
  };
}

export async function audit(db: Queryable, actorId: string | undefined, action: string, targetType: string, targetId: string, outcome: 'success' | 'failure') {
  await appendAuditEvent(db, { actorType: actorId ? 'admin' : 'system', actorId, action, targetType, targetId, outcome });
}
