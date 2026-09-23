import type { Queryable } from './pool.js';

export type ReadinessReport = {
  ready: boolean;
  checks: {
    config: 'ok' | 'failed';
    database: 'ok' | 'failed';
    migrations: 'ok' | 'failed';
    providers: 'ok' | 'failed';
  };
};

export async function checkDatabaseReady(db: Queryable, expectedMigrationCount = 5): Promise<ReadinessReport> {
  const report: ReadinessReport = {
    ready: false,
    checks: { config: 'ok', database: 'failed', migrations: 'failed', providers: 'ok' }
  };

  try {
    await db.query('SELECT 1');
    report.checks.database = 'ok';
    const migrations = await db.query('SELECT COUNT(*)::int AS count FROM schema_migrations');
    const count = Number(migrations.rows[0]?.count ?? 0);
    report.checks.migrations = count >= expectedMigrationCount ? 'ok' : 'failed';
    report.ready = report.checks.database === 'ok' && report.checks.migrations === 'ok';
    return report;
  } catch {
    return report;
  }
}
