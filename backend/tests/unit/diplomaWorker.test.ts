import type { QueryResult } from 'pg';
import { describe, expect, it, vi } from 'vitest';
import { processNextDiplomaDelivery } from '../../src/modules/diplomas/diplomaWorker.js';
import type { Queryable } from '../../src/db/pool.js';

class DiplomaDb implements Queryable {
  state = 'pending';
  diplomaGrade = 'Coronel (R)';
  attempts = 0;
  statements: string[] = [];

  async query(text: string, values: unknown[] = []): Promise<QueryResult> {
    this.statements.push(text);
    if (text.includes('WITH candidate AS')) {
      if (this.state !== 'pending') return result([]);
      this.state = 'processing';
      this.attempts += 1;
      return result([{ id: 'delivery-1', campaign_id: 'campaign-1', recipient_email: 'participant@example.test', participant_name: 'Participant Name', diploma_grade: this.diplomaGrade, attempts: this.attempts }]);
    }
    if (text.includes("SET state = 'delivered'")) this.state = 'delivered';
    if (text.includes('SET state = $1, claimed_by')) this.state = String(values[0]);
    return result([]);
  }
}

function result(rows: Record<string, unknown>[]): QueryResult {
  return { command: 'SELECT', rowCount: rows.length, oid: 0, fields: [], rows };
}

describe('diploma delivery worker', () => {
  it('forces Señor/a for a legacy queued delivery, attaches it, hashes it, and records simulated delivery', async () => {
    const db = new DiplomaDb();
    const provider = { mode: 'simulation' as const, send: vi.fn(async () => ({ providerId: 'simulated-1' })) };
    const generator = { generate: vi.fn(async () => Buffer.from('%PDF-test')) };

    await expect(processNextDiplomaDelivery(db, provider, generator, 'worker-test', () => {})).resolves.toBe(true);

    expect(generator.generate).toHaveBeenCalledWith({ fullName: 'Participant Name', grade: 'Señor/a' });
    expect(provider.send).toHaveBeenCalledWith(expect.objectContaining({ to: 'participant@example.test', attachments: [{ name: 'Salutacion - DCEA.pdf', content: Buffer.from('%PDF-test') }] }));
    expect(db.state).toBe('delivered');
    expect(db.statements.some((statement) => statement.includes('pdf_sha256'))).toBe(true);
  });

  it('records a bounded retry without calling the provider when generation fails', async () => {
    const db = new DiplomaDb();
    const provider = { mode: 'simulation' as const, send: vi.fn() };
    const generator = { generate: vi.fn(async () => { throw new Error('render failed'); }) };

    await expect(processNextDiplomaDelivery(db, provider, generator, 'worker-test', () => {})).resolves.toBe(true);

    expect(provider.send).not.toHaveBeenCalled();
    expect(db.state).toBe('retryable_failed');
  });
});
