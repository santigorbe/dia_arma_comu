import { describe, expect, it } from 'vitest';
import { loadMigrations, runMigrations } from '../../src/db/migrate.js';
import { FakeDb } from '../helpers/fakeDb.js';

describe('foundation migrations', () => {
  it('loads ordered versioned SQL migrations', async () => {
    const migrations = await loadMigrations();

    expect(migrations.map((migration) => migration.name)).toEqual([
      '0001_core.sql',
      '0002_content.sql',
      '0003_certificates.sql',
      '0004_communications.sql',
      '0005_retention.sql'
    ]);
    expect(migrations.every((migration) => migration.sql.includes('CREATE TABLE IF NOT EXISTS'))).toBe(true);
  });

  it('runs twice safely and records each version once', async () => {
    const db = new FakeDb();
    const migrations = await loadMigrations();

    await expect(runMigrations(db, migrations)).resolves.toEqual(['0001', '0002', '0003', '0004', '0005']);
    await expect(runMigrations(db, migrations)).resolves.toEqual([]);

    expect([...db.migrations]).toEqual(['0001', '0002', '0003', '0004', '0005']);
  });

  it('rolls back failed migrations without exposing the failing SQL as a readiness detail', async () => {
    const db = new FakeDb();
    db.failOnSqlPattern = /communication_jobs/;
    const migrations = await loadMigrations();

    await expect(runMigrations(db, migrations)).rejects.toThrow('simulated database failure');
    expect(db.statements).toContain('ROLLBACK');
    expect([...db.migrations]).toEqual(['0001', '0002', '0003']);
  });
});
