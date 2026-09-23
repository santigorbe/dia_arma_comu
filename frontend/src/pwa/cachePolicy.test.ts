import { describe, expect, it } from 'vitest';
import { shouldCachePublicRead } from './cachePolicy';

describe('public PWA cache policy', () => {
  it('caches only public read contracts and excludes mutations, registration, certificates, and private paths', () => {
    expect(shouldCachePublicRead(new URL('https://example.test/api/public/content'))).toBe(true);
    expect(shouldCachePublicRead(new URL('https://example.test/api/public/schedule'))).toBe(true);
    expect(shouldCachePublicRead(new URL('https://example.test/api/public/map'))).toBe(true);
    expect(shouldCachePublicRead(new URL('https://example.test/api/public/registrations'))).toBe(false);
    expect(shouldCachePublicRead(new URL('https://example.test/api/public/certificates'))).toBe(false);
    expect(shouldCachePublicRead(new URL('https://example.test/api/admin/content'))).toBe(false);
    expect(shouldCachePublicRead(new URL('https://example.test/api/public/content'), 'POST')).toBe(false);
  });
});
