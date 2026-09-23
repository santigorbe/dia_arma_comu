import cookieParser from 'cookie-parser';
import cors from 'cors';
import type { RequestHandler } from 'express';
import express from 'express';
import helmet from 'helmet';
import type { CookieOptions } from 'express';
import type { AppEnv } from '../../config/env.js';
import { buildCspDirectives } from '../../config/csp.js';
import { AppError } from './errors.js';

export function securityMiddleware(env: AppEnv): RequestHandler[] {
  return [
    helmet({ contentSecurityPolicy: { directives: buildCspDirectives(env) } }),
    cors({
      credentials: true,
      origin(origin, callback) {
        if (!origin || env.allowedOrigins.includes(origin)) {
          callback(null, true);
          return;
        }
        callback(new AppError(403, 'origin_not_allowed'));
      }
    }),
    express.json({ limit: '100kb', strict: true }),
    cookieParser()
  ];
}

export function authCookieOptions(env: AppEnv): CookieOptions {
  return {
    httpOnly: true,
    sameSite: env.AUTH_COOKIE_SAME_SITE,
    secure: env.NODE_ENV === 'production' || env.AUTH_COOKIE_SECURE,
    path: '/api/admin',
    maxAge: env.AUTH_COOKIE_MAX_AGE_SECONDS * 1000,
    ...(env.AUTH_COOKIE_DOMAIN ? { domain: env.AUTH_COOKIE_DOMAIN } : {})
  };
}
