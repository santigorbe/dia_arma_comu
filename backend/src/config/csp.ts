import type { AppEnv } from './env.js';

function toOrigin(url: string): string {
  try {
    return new URL(url.replace(/\{[a-z]\}/gi, '0')).origin;
  } catch {
    return url;
  }
}

export function buildCspDirectives(env: AppEnv) {
  const mapTileOrigin = toOrigin(env.MAP_TILE_URL);
  const origins = ["'self'", ...env.allowedOrigins, mapTileOrigin];

  return {
    defaultSrc: ["'self'"],
    baseUri: ["'self'"],
    objectSrc: ["'none'"],
    frameAncestors: ["'none'"],
    scriptSrc: ["'self'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    imgSrc: ["'self'", 'data:', 'blob:', mapTileOrigin],
    connectSrc: origins,
    workerSrc: ["'self'"],
    manifestSrc: ["'self'"]
  };
}
