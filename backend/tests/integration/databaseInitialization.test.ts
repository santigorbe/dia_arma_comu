import { describe, expect, it } from 'vitest';
import { initializeDatabase } from '../../src/db/initialize.js';
import { FakeDb } from '../helpers/fakeDb.js';

describe('database initialization', () => {
  it('applies migrations before atomically activating the configured consent version', async () => {
    const db = new FakeDb();

    await expect(initializeDatabase(db, { ACTIVE_CONSENT_VERSION: 'consent-local', CONSENT_TEXT: 'Local consent text.' })).resolves.toEqual([
      '0001',
      '0002',
      '0003',
      '0004',
      '0005',
      '0006',
      '0007',
       '0008',
       '0009',
       '0010',
       '0011',
       '0012',
       '0013',
       '0014'
    ]);

    const deactivateIndex = db.statements.findIndex((statement) => statement.startsWith('UPDATE consent_versions SET is_active = false'));
    const activateIndex = db.statements.findIndex((statement) => statement.startsWith('INSERT INTO consent_versions'));
    expect(deactivateIndex).toBeGreaterThan(db.statements.findIndex((statement) => statement.includes('INSERT INTO schema_migrations')));
    expect(activateIndex).toBeGreaterThan(deactivateIndex);
    expect(db.statements).toContain('COMMIT');
  });
});
