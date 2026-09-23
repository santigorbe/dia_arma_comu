import crypto from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';

const SENSITIVE_PATTERN = /(password|secret|token|cookie|jwt|authorization|sql|stack|email|phone|fullName|full_name)/gi;

export class AppError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(status: number, code: string, message = code, details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export type RequestWithId = Request & { requestId?: string };

export function requestIdMiddleware(request: RequestWithId, response: Response, next: NextFunction) {
  const presented = request.header('x-request-id');
  request.requestId = presented && presented.length <= 80 ? presented : crypto.randomUUID();
  response.setHeader('x-request-id', request.requestId);
  next();
}

export function safeErrorBody(error: unknown, requestId: string) {
  if (error instanceof AppError) {
    return {
      error: error.code,
      requestId,
      ...(isSafeDetails(error.details) ? { details: error.details } : {})
    };
  }

  return { error: 'internal_error', requestId };
}

export function errorHandler(error: unknown, request: RequestWithId, response: Response, _next: NextFunction) {
  const requestId = request.requestId ?? crypto.randomUUID();
  const status = error instanceof AppError ? error.status : 500;
  response.status(status).json(safeErrorBody(error, requestId));
}

export function notFoundHandler(request: RequestWithId, response: Response) {
  response.status(404).json({ error: 'not_found', requestId: request.requestId ?? crypto.randomUUID() });
}

function isSafeDetails(details: unknown) {
  if (!details || typeof details !== 'object') {
    return false;
  }

  return !SENSITIVE_PATTERN.test(JSON.stringify(details));
}

export function assertSafeClientBody(body: unknown) {
  const serialized = JSON.stringify(body);
  if (SENSITIVE_PATTERN.test(serialized) || /SELECT|INSERT|UPDATE|DELETE|constraint|at .*\(/i.test(serialized)) {
    throw new Error(`Unsafe client error body: ${serialized}`);
  }
}
