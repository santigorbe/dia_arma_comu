import type { QueryResult } from 'pg';
import crypto from 'node:crypto';
import type { Queryable } from '../../src/db/pool.js';

export class FakeDb implements Queryable {
  readonly statements: string[] = [];
  readonly migrations = new Set<string>();
  readonly visits = new Set<string>();
  readonly idempotency = new Map<string, { response_status: number; response_body: unknown }>();
  readonly participants = new Map<string, Record<string, unknown>>();
  readonly audits: Record<string, unknown>[] = [];
  publicContent: Record<string, unknown>[] = [];
  publicSchedule: Record<string, unknown>[] = [];
  publicMapPoints: Record<string, unknown>[] = [];
  activeConsent = { version: 'consent-2026-09', display_text: 'Test consent text.' };
  failOnSqlPattern?: RegExp;

  async query(text: string, values: unknown[] = []): Promise<QueryResult> {
    this.statements.push(text);

    if (this.failOnSqlPattern?.test(text)) {
      throw new Error('simulated database failure with secret-token-value');
    }

    if (text.includes('SELECT version FROM schema_migrations')) {
      const version = String(values[0]);
      return result(this.migrations.has(version) ? [{ version }] : []);
    }

    if (text.includes('INSERT INTO schema_migrations')) {
      this.migrations.add(String(values[0]));
      return result([]);
    }

    if (text.includes('SELECT COUNT(*)::int AS count FROM schema_migrations')) {
      return result([{ count: this.migrations.size }]);
    }

    if (text.includes('SELECT 1')) {
      return result([{ '?column?': 1 }]);
    }

    if (text.includes('INSERT INTO anonymous_visits')) {
      this.visits.add(String(values[0]));
      return result([]);
    }

    if (text.includes('SELECT response_status, response_body FROM idempotency_records')) {
      const stored = this.idempotency.get(String(values[1]));
      return result(stored ? [stored] : []);
    }

    if (text.includes('INSERT INTO idempotency_records')) {
      this.idempotency.set(String(values[1]), { response_status: Number(values[2]), response_body: values[3] });
      return result([]);
    }

    if (text.includes('SELECT version, display_text FROM consent_versions')) {
      return result([this.activeConsent]);
    }

    if (text.includes('FROM event_content')) {
      return result(this.publicContent);
    }

    if (text.includes('FROM schedule_entries')) {
      return result(this.publicSchedule);
    }

    if (text.includes('FROM map_points')) {
      return result(this.publicMapPoints);
    }

    if (text.includes('SELECT id, full_name, email, phone, unit_or_organization FROM participants')) {
      const found = this.participants.get(String(values[0]));
      return result(found ? [found] : []);
    }

    if (text.includes('INSERT INTO participants')) {
      const id = crypto.randomUUID();
      const row = { id, full_name: values[0], email: values[1], phone: values[2], unit_or_organization: values[3] };
      this.participants.set(String(values[1]), row);
      return result([{ id }]);
    }

    if (text.includes('INSERT INTO registration_consents')) {
      return result([]);
    }

    if (text.includes('INSERT INTO audit_events')) {
      const row = { id: crypto.randomUUID(), created_at: new Date().toISOString() };
      this.audits.push({ row, values });
      return result([row]);
    }

    if (text.includes('REVOKE UPDATE, DELETE ON audit_events')) {
      return result([]);
    }

    return result([]);
  }
}

function result(rows: Record<string, unknown>[]): QueryResult {
  return {
    command: 'SELECT',
    rowCount: rows.length,
    oid: 0,
    fields: [],
    rows
  };
}
