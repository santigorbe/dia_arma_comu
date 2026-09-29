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
       '0008_demo_schedule.sql',
       '0009_correct_demo_map_points.sql',
       '0010_participant_personnel_type.sql',
       '0011_real_event_content_and_schedule.sql',
       '0012_participant_service_status.sql',
       '0013_schedule_entry_categories.sql',
       '0014_relax_participant_service_status.sql',
       '0015_diploma_campaigns.sql'
    ]);
    expect(migrations.every((migration) => migration.sql.trim().length > 0)).toBe(true);
  });

  it('runs twice safely and records each version once', async () => {
    const db = new FakeDb();
    const migrations = await loadMigrations();

    await expect(runMigrations(db, migrations)).resolves.toEqual(['0001', '0002', '0003', '0004', '0005', '0006', '0007', '0008', '0009', '0010', '0011', '0012', '0013', '0014', '0015']);
    await expect(runMigrations(db, migrations)).resolves.toEqual([]);

    expect([...db.migrations]).toEqual(['0001', '0002', '0003', '0004', '0005', '0006', '0007', '0008', '0009', '0010', '0011', '0012', '0013', '0014', '0015']);
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

  it('corrects only the six identified Córdoba demo points and is idempotent', async () => {
    const migration = (await loadMigrations()).find((entry) => entry.name === '0009_correct_demo_map_points.sql');
    expect(migration).toBeDefined();
    const sql = migration!.sql;

    expect(sql).toMatch(/^UPDATE map_points AS point/m);
    expect(sql).toContain('WHERE point.label = demo.label');
    expect(sql).toContain('AND point.description = demo.description');
    expect(sql).toContain("state = 'published'");
    expect(sql).toContain('published_at = COALESCE(point.published_at, now())');
    expect(sql).toContain('IS DISTINCT FROM');
    expect(sql.match(/Datos ilustrativos \/ no oficiales\. Coordenada demo deliberadamente aproximada para orientar\./g)).toHaveLength(6);
    expect(sql.match(/-31\.38\d+::numeric, -64\.18\d+::numeric/g)).toHaveLength(6);
    expect(sql).not.toMatch(/\b(INSERT|DELETE|TRUNCATE)\b/i);
  });

  it('retires the fictional demo schedule via soft delete and seeds the real published content and schedule', async () => {
    const migration = (await loadMigrations()).find((entry) => entry.name === '0011_real_event_content_and_schedule.sql');
    expect(migration).toBeDefined();
    const sql = migration!.sql;

    expect(sql).toContain("UPDATE schedule_entries");
    expect(sql).toContain("SET deleted_at = now()");
    expect(sql).toContain('d29a0008-0000-4000-8000-000000000001');
    expect(sql).toContain("ON CONFLICT (content_key) DO UPDATE");
    expect(sql).toContain("ON CONFLICT (id) DO NOTHING");
    expect(sql.match(/2026-10-02 \d{2}:\d{2}:00-03:00/g)).toHaveLength(12);
    expect(sql).not.toMatch(/\bDELETE\b|\bTRUNCATE\b/i);
  });

  it('constrains service_status to the personnel type without touching existing data', async () => {
    const migration = (await loadMigrations()).find((entry) => entry.name === '0012_participant_service_status.sql');
    expect(migration).toBeDefined();
    const sql = migration!.sql;

    expect(sql).toContain('ADD COLUMN IF NOT EXISTS service_status text');
    expect(sql).toContain("service_status IN ('actividad', 'retiro')");
    expect(sql).not.toMatch(/\bINSERT\b|\bUPDATE\b|\bDELETE\b|\bTRUNCATE\b/i);
  });

  it('assigns a visual category to each real schedule entry without touching other data', async () => {
    const migration = (await loadMigrations()).find((entry) => entry.name === '0013_schedule_entry_categories.sql');
    expect(migration).toBeDefined();
    const sql = migration!.sql;

    expect(sql).toContain('ADD COLUMN IF NOT EXISTS category text');
    for (const id of [
      '0f4abc54-cd4a-41fd-b43d-cc26c5ad5152',
      '052d6b67-b8a7-45ce-ab32-7e9f361e429c',
      '3c35c4a4-bf23-4669-846a-f60ca0e45f0f',
      '3501d84d-9eb5-483c-a4e4-737c6d7779ef',
      '94a61023-12a5-447c-93c3-6e397d7d4935',
      '819a4590-32e6-4ef3-9a60-4181f0343c8c'
    ]) {
      expect(sql).toContain(id);
    }
    expect(sql).not.toMatch(/\bINSERT\b|\bDELETE\b|\bTRUNCATE\b/i);
  });

  it('allows a null service status while preserving valid military status values', async () => {
    const migration = (await loadMigrations()).find((entry) => entry.name === '0014_relax_participant_service_status.sql');
    expect(migration).toBeDefined();
    const sql = migration!.sql;

    expect(sql).toContain('DROP CONSTRAINT IF EXISTS participants_service_status_check');
    expect(sql).toContain('service_status IS NULL');
    expect(sql).toContain("personnel_type = 'militar' AND service_status IN ('actividad', 'retiro')");
    expect(sql).not.toMatch(/DROP COLUMN|\bINSERT\b|\bUPDATE\b|\bDELETE\b|\bTRUNCATE\b/i);
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
