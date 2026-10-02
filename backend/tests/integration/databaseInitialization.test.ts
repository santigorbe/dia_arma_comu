import { describe, expect, it } from 'vitest';
import { initializeDatabase } from '../../src/db/initialize.js';
import { FakeDb } from '../helpers/fakeDb.js';

describe('database initialization', () => {
  it('applies all versioned migrations', async () => {
    const db = new FakeDb();

    await expect(initializeDatabase(db)).resolves.toEqual([
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
        '0014',
        '0015',
         '0016',
           '0017',
           '0018',
           '0019',
           '0020'
    ]);

    expect(db.statements.filter((statement) => statement.includes('INSERT INTO schema_migrations'))).toHaveLength(20);
  });
});
