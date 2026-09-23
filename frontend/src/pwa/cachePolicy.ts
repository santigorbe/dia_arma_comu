const publicReadPaths = new Set(['/api/public/content', '/api/public/schedule', '/api/public/map']);

export function shouldCachePublicRead(url: URL, method = 'GET') {
  return method === 'GET' && publicReadPaths.has(url.pathname);
}
