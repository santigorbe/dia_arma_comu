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

function timingSafeEqual(a: string, b: string): boolean {
  const bufferA = Buffer.from(a);
  const bufferB = Buffer.from(b);
  if (bufferA.length !== bufferB.length) return false;
  return crypto.timingSafeEqual(bufferA, bufferB);
}
