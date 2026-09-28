import crypto from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import type { AppEnv } from '../../config/env.js';
import { AppError } from '../../shared/http/errors.js';

export function requireIntegrationToken(env: AppEnv) {
  return (request: Request, _response: Response, next: NextFunction) => {
    const header = request.header('authorization') ?? '';
    const presented = header.startsWith('Bearer ') ? header.slice('Bearer '.length) : '';

    if (!presented || !timingSafeEqual(presented, env.INTEGRATIONS_API_TOKEN)) {
      next(new AppError(401, 'invalid_integration_token'));
      return;
    }

    next();
  };
}

// Browsers cannot attach a custom header when a URL is opened directly, so the
// image-viewing route also accepts ?token=... for that one convenience case.
// Kept separate from requireIntegrationToken so /datos and the upload route
// stay header-only and never end up echoed into browser history or logs.
export function requireIntegrationTokenFromHeaderOrQuery(env: AppEnv) {
  return (request: Request, _response: Response, next: NextFunction) => {
    const header = request.header('authorization') ?? '';
    const fromHeader = header.startsWith('Bearer ') ? header.slice('Bearer '.length) : '';
    const fromQuery = typeof request.query.token === 'string' ? request.query.token : '';
    const presented = fromHeader || fromQuery;

    if (!presented || !timingSafeEqual(presented, env.INTEGRATIONS_API_TOKEN)) {
      next(new AppError(401, 'invalid_integration_token'));
      return;
    }

    next();
  };
}

function timingSafeEqual(a: string, b: string): boolean {
  const bufferA = Buffer.from(a);
  const bufferB = Buffer.from(b);
  if (bufferA.length !== bufferB.length) return false;
  return crypto.timingSafeEqual(bufferA, bufferB);
}
