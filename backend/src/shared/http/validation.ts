import type { RequestHandler } from 'express';
import { ZodError, type ZodTypeAny, z } from 'zod';
import { AppError, type DetailAllowlist } from './errors.js';

export const uuidSchema = z.string().uuid();
export const idempotencyKeySchema = z.string().uuid();

export type RequestSchemas = {
  params?: ZodTypeAny;
  query?: ZodTypeAny;
  headers?: ZodTypeAny;
  cookies?: ZodTypeAny;
  body?: ZodTypeAny;
};

export function validateRequest(schemas: RequestSchemas, detailAllowlist?: DetailAllowlist): RequestHandler {
  return (request, _response, next) => {
    try {
      if (schemas.params) request.params = schemas.params.parse(request.params);
      if (schemas.query) request.query = schemas.query.parse(request.query);
      if (schemas.headers) schemas.headers.parse(request.headers);
      if (schemas.cookies) schemas.cookies.parse(request.cookies);
      if (schemas.body) request.body = schemas.body.parse(request.body);
      next();
    } catch (error) {
      next(toValidationError(error, detailAllowlist));
    }
  };
}

export function parseOrThrow<T extends ZodTypeAny>(schema: T, value: unknown): z.infer<T> {
  try {
    return schema.parse(value);
  } catch (error) {
    throw toValidationError(error);
  }
}

function toValidationError(error: unknown, detailAllowlist?: DetailAllowlist) {
  if (error instanceof ZodError) {
    return new AppError(
      400,
      'validation_failed',
      'validation_failed',
      error.issues.map((issue) => ({ field: issue.path.join('.'), code: issue.code })),
      detailAllowlist
    );
  }

  return error;
}
