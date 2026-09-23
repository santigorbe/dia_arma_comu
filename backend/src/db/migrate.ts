import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadEnv } from '../config/env.js';
import { closePool, createPool, type Queryable, type TransactionalPool } from './pool.js';

export type Migration = {
  version: string;
  name: string;
  sql: string;
};

export async function loadMigrations(directory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../migrations')): Promise<Migration[]> {
  const files = (await readdir(directory)).filter((file) => /^\d{4}_.+\.sql$/.test(file)).sort();
  return Promise.all(
    files.map(async (file) => ({
      version: file.slice(0, 4),
      name: file,
      sql: await readFile(path.join(directory, file), 'utf8')
    }))
  );
}

export async function ensureMigrationTable(db: Queryable): Promise<void> {
  await db.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version text PRIMARY KEY,
      name text NOT NULL,
      applied_at timestamptz NOT NULL DEFAULT now()
    )
  `);
}

export async function runMigrations(db: Queryable, migrations: Migration[]): Promise<string[]> {
  await ensureMigrationTable(db);
  const applied: string[] = [];

  for (const migration of migrations) {
    const result = await db.query('SELECT version FROM schema_migrations WHERE version = $1', [migration.version]);
    if (result.rowCount && result.rowCount > 0) {
      continue;
    }

    const client = 'connect' in db ? await (db as TransactionalPool).connect() : db;
    await client.query('BEGIN');
    try {
      await client.query(migration.sql);
      await client.query('INSERT INTO schema_migrations (version, name) VALUES ($1, $2)', [migration.version, migration.name]);
      await client.query('COMMIT');
      applied.push(migration.version);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      if ('release' in client && typeof client.release === 'function') client.release();
    }
  }

  return applied;
}

export async function migrateCli(): Promise<void> {
  const env = loadEnv();
  const pool = createPool(env);
  try {
    const migrations = await loadMigrations();
    const applied = await runMigrations(pool, migrations);
    console.log(`Applied ${applied.length} migration(s).`);
  } finally {
    await closePool(pool);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  migrateCli().catch((error) => {
    console.error(error instanceof Error ? error.message : 'Migration failed');
    process.exit(1);
  });
}
