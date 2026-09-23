import type { AppEnv } from '../config/env.js';
import { loadMigrations, runMigrations } from './migrate.js';
import type { Queryable, TransactionalPool } from './pool.js';

export async function ensureActiveConsent(db: Queryable, env: Pick<AppEnv, 'ACTIVE_CONSENT_VERSION' | 'CONSENT_TEXT'>): Promise<void> {
  const client = 'connect' in db ? await (db as TransactionalPool).connect() : db;
  await client.query('BEGIN');
  try {
    await client.query('UPDATE consent_versions SET is_active = false WHERE is_active = true AND version <> $1', [env.ACTIVE_CONSENT_VERSION]);
    await client.query(
      `INSERT INTO consent_versions (version, display_text, is_active)
       VALUES ($1, $2, true)
       ON CONFLICT (version) DO UPDATE SET display_text = EXCLUDED.display_text, is_active = true`,
      [env.ACTIVE_CONSENT_VERSION, env.CONSENT_TEXT]
    );
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    if ('release' in client && typeof client.release === 'function') client.release();
  }
}

export async function initializeDatabase(db: Queryable, env: Pick<AppEnv, 'ACTIVE_CONSENT_VERSION' | 'CONSENT_TEXT'>): Promise<string[]> {
  const applied = await runMigrations(db, await loadMigrations());
  await ensureActiveConsent(db, env);
  return applied;
}
