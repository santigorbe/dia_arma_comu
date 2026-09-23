import pg from 'pg';
import type { AppEnv } from '../config/env.js';

export type Queryable = {
  query(text: string, values?: unknown[]): Promise<pg.QueryResult>;
};

export type TransactionalPool = Queryable & { connect(): Promise<pg.PoolClient> };

export function createPool(env: AppEnv): pg.Pool {
  return new pg.Pool({
    connectionString: env.DATABASE_URL,
    max: 10,
    idleTimeoutMillis: 30_000
  });
}

export async function closePool(pool: pg.Pool): Promise<void> {
  await pool.end();
}
