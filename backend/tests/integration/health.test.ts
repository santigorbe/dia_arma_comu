import { describe, expect, it } from 'vitest';
import { loadEnv } from '../../src/config/env.js';
import { checkDatabaseReady } from '../../src/db/health.js';
import { FakeDb } from '../helpers/fakeDb.js';

const baseEnv = {
  NODE_ENV: 'test',
  FRONTEND_ORIGIN: 'http://localhost:5173',
  BACKEND_ORIGIN: 'http://localhost:3000',
  PUBLIC_BASE_URL: 'http://localhost:5173',
  DATABASE_URL: 'postgres://user:pass@localhost:5432/testdb',
  JWT_SECRET: 'test-secret-value-with-at-least-thirty-two-characters',
  ACTIVE_CONSENT_VERSION: 'consent-test',
  CONSENT_TEXT: 'Test consent text',
  EMAIL_PROVIDER_MODE: 'simulation',
  WHATSAPP_PROVIDER_MODE: 'simulation',
  MAP_TILE_URL: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
  INTEGRATIONS_API_TOKEN: 'test-integration-token-with-enough-length',
  ADMIN_BOOTSTRAP_IDENTIFIER: 'test-admin',
  ADMIN_BOOTSTRAP_PASSWORD: 'test-bootstrap-password'
};

describe('foundation health checks', () => {
  it('separates liveness from database-dependent readiness', async () => {
    expect(() => loadEnv(baseEnv)).not.toThrow();
    const db = new FakeDb();

    await expect(checkDatabaseReady(db)).resolves.toMatchObject({ ready: false, checks: { database: 'ok', migrations: 'failed' } });
  });

  it('reports ready when database and migrations are healthy in simulation mode', async () => {
    const env = loadEnv(baseEnv);
    expect(env.providers).toEqual({ emailReady: true, whatsappReady: true });

    const db = new FakeDb();
    for (const version of ['0001', '0002', '0003', '0004', '0005', '0006', '0007', '0008']) {
      db.migrations.add(version);
    }

    await expect(checkDatabaseReady(db)).resolves.toEqual({
      ready: true,
      checks: { config: 'ok', database: 'ok', migrations: 'ok', providers: 'ok' }
    });
  });

  it('fails fast with configuration names but without secret values', () => {
    expect(() => loadEnv({ ...baseEnv, JWT_SECRET: 'short' })).toThrow(/JWT_SECRET/);
    expect(() => loadEnv({ ...baseEnv, JWT_SECRET: 'short' })).not.toThrow(/short/);
  });

  it('allows unset administrator bootstrap values until the one-time command is invoked', () => {
    expect(() => loadEnv({ ...baseEnv, ADMIN_BOOTSTRAP_IDENTIFIER: '', ADMIN_BOOTSTRAP_PASSWORD: '' })).not.toThrow();
  });

  it('keeps real provider readiness gated by complete configuration', () => {
    expect(() => loadEnv({ ...baseEnv, EMAIL_PROVIDER_MODE: 'real', BREVO_API_KEY: '', BREVO_FROM_EMAIL: '' })).toThrow(/BREVO_API_KEY/);
    expect(() => loadEnv({ ...baseEnv, WHATSAPP_PROVIDER_MODE: 'real', WHATSAPP_API_URL: '', WHATSAPP_ACCESS_TOKEN: '' })).toThrow(/WHATSAPP_API_URL/);
  });

  it('accepts a configured production Brevo sender for operator verification', () => {
    expect(() => loadEnv({ ...baseEnv, NODE_ENV: 'production', AUTH_COOKIE_SECURE: 'true', EMAIL_PROVIDER_MODE: 'real', BREVO_API_KEY: 'test-key', BREVO_FROM_EMAIL: 'events@example.test' })).not.toThrow();
  });
});
