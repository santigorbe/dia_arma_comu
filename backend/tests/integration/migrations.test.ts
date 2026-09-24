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
      '0005_retention.sql',
      '0006_admin_content.sql',
      '0007_demo_map_points.sql',
      '0008_demo_schedule.sql'
    ]);
    expect(migrations.every((migration) => migration.sql.trim().length > 0)).toBe(true);
  });

  it('runs twice safely and records each version once', async () => {
    const db = new FakeDb();
    const migrations = await loadMigrations();

    await expect(runMigrations(db, migrations)).resolves.toEqual(['0001', '0002', '0003', '0004', '0005', '0006', '0007', '0008']);
    await expect(runMigrations(db, migrations)).resolves.toEqual([]);

    expect([...db.migrations]).toEqual(['0001', '0002', '0003', '0004', '0005', '0006', '0007', '0008']);
  });

  it('seeds published fictional activities with stable IDs and preserves existing rows', async () => {
    const migration = (await loadMigrations()).find((entry) => entry.name === '0008_demo_schedule.sql');
    expect(migration).toBeDefined();
    const sql = migration!.sql;
    expect(sql).toContain('ON CONFLICT (id) DO NOTHING');
    expect(sql).not.toMatch(/\b(UPDATE|DELETE|TRUNCATE)\b/i);
    expect(sql.match(/Ficticio \/ no oficial/g)).toHaveLength(4);
    expect(sql.match(/2026-09-29 \d{2}:\d{2}:00-03:00/g)).toHaveLength(8);
    expect(sql.match(/'published'/g)).toHaveLength(4);
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
