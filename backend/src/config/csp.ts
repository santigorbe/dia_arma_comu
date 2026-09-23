import type { AppEnv } from './env.js';

export function buildCspDirectives(env: AppEnv) {
  const origins = ["'self'", ...env.allowedOrigins, env.MAP_TILE_URL];

  return {
    defaultSrc: ["'self'"],
    baseUri: ["'self'"],
    objectSrc: ["'none'"],
    frameAncestors: ["'none'"],
    scriptSrc: ["'self'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    imgSrc: ["'self'", 'data:', 'blob:', env.MAP_TILE_URL],
    connectSrc: origins,
    workerSrc: ["'self'"],
    manifestSrc: ["'self'"]
  };
}
