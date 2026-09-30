import { loadMigrations, runMigrations } from './migrate.js';
import type { Queryable } from './pool.js';

export async function initializeDatabase(db: Queryable): Promise<string[]> {
  return runMigrations(db, await loadMigrations());
}
