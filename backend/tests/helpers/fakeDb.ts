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
  readonly admins = new Map<string, { id: string; password_hash: string; is_active: boolean }>();
  readonly invalidatedAdminTokens = new Set<string>();
  readonly diplomaCampaigns: Array<{ id: string; state: string; audienceCount: number; origin?: string; registration_participant_id?: string }> = [];
  readonly diplomaDeliveries: Array<Record<string, unknown>> = [];
  readonly adminResources = new Map<string, Map<string, Record<string, unknown>>>();
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

    if (text.includes('SELECT id, password_hash, is_active FROM admins WHERE identifier = $1')) {
      const admin = this.admins.get(String(values[0]));
      return result(admin ? [admin] : []);
    }

    if (text.includes('SELECT jwt_id FROM admin_token_invalidations')) {
      const jwtId = String(values[0]);
      return result(this.invalidatedAdminTokens.has(jwtId) ? [{ jwt_id: jwtId }] : []);
    }

    if (text.includes('SELECT id FROM admins WHERE id = $1 AND is_active = true')) {
      const admin = [...this.admins.values()].find((candidate) => candidate.id === values[0] && candidate.is_active);
      return result(admin ? [{ id: admin.id }] : []);
    }

    if (text.includes('INSERT INTO admin_token_invalidations')) {
      this.invalidatedAdminTokens.add(String(values[0]));
      return result([]);
    }

    if (text.includes('INSERT INTO diploma_campaigns (origin, registration_participant_id, audience_count)')) {
      const participantId = String(values[0]);
      let campaign = this.diplomaCampaigns.find((entry) => entry.origin === 'registration' && entry.registration_participant_id === participantId);
      if (!campaign) {
        campaign = { id: `diploma-campaign-${this.diplomaCampaigns.length + 1}`, state: 'queued', audienceCount: 1, origin: 'registration', registration_participant_id: participantId };
        this.diplomaCampaigns.push(campaign);
      }
      return result([campaign]);
    }

    if (text.includes('INSERT INTO diploma_deliveries (campaign_id, participant_id, recipient_email, participant_name, military_rank, diploma_grade) VALUES')) {
      const [campaignId, participantId, recipientEmail, participantName, militaryRank, diplomaGrade] = values;
      if (!this.diplomaDeliveries.some((entry) => entry.campaign_id === campaignId && entry.participant_id === participantId)) {
        this.diplomaDeliveries.push({ campaign_id: campaignId, participant_id: participantId, recipient_email: recipientEmail, participant_name: participantName, military_rank: militaryRank, diploma_grade: diplomaGrade });
      }
      return result([]);
    }

    if (text.includes('INSERT INTO diploma_campaigns')) {
      const campaign = { id: `diploma-campaign-${this.diplomaCampaigns.length + 1}`, state: 'queued', audienceCount: 0 };
      this.diplomaCampaigns.push(campaign);
      return result([campaign]);
    }

    if (text.includes('INSERT INTO diploma_deliveries')) {
      const campaignId = String(values[0]);
      for (const participant of this.participants.values()) {
        this.diplomaDeliveries.push({
          campaign_id: campaignId,
          participant_id: participant.id,
          recipient_email: participant.email,
          participant_name: participant.full_name,
          military_rank: participant.military_rank || 'NA',
          diploma_grade: diplomaGrade(participant)
        });
      }
      return result(this.diplomaDeliveries);
    }

    if (text.includes('UPDATE diploma_campaigns')) {
      const campaign = this.diplomaCampaigns.find((entry) => entry.id === String(values.at(-1)));
      if (campaign && values.length >= 3) {
        campaign.audienceCount = Number(values[0]);
        campaign.state = String(values[1]);
      }
      return result([]);
    }

    if (text.includes('SELECT id, card_image_filename FROM participants WHERE email = $1')) {
      const participant = this.participants.get(String(values[0]));
      return result(participant ? [participant] : []);
    }

    if (text.includes('DELETE FROM diploma_deliveries WHERE participant_id = $1')) {
      const participantId = String(values[0]);
      for (let index = this.diplomaDeliveries.length - 1; index >= 0; index -= 1) {
        if (this.diplomaDeliveries[index].participant_id === participantId) this.diplomaDeliveries.splice(index, 1);
      }
      return result([]);
    }

    if (text.includes("DELETE FROM diploma_campaigns WHERE origin = 'registration' AND registration_participant_id = $1")) {
      const participantId = String(values[0]);
      for (let index = this.diplomaCampaigns.length - 1; index >= 0; index -= 1) {
        const campaign = this.diplomaCampaigns[index];
        if (campaign.origin === 'registration' && campaign.registration_participant_id === participantId) this.diplomaCampaigns.splice(index, 1);
      }
      return result([]);
    }

    if (text.includes('DELETE FROM participants WHERE id = $1')) {
      const participantId = String(values[0]);
      for (const [email, participant] of this.participants) {
        if (participant.id === participantId) this.participants.delete(email);
      }
      return result([]);
    }

    if (text.startsWith('INSERT INTO event_content') || text.startsWith('INSERT INTO schedule_entries') || text.startsWith('INSERT INTO map_points') || text.startsWith('UPDATE event_content') || text.startsWith('UPDATE schedule_entries') || text.startsWith('UPDATE map_points') || text.includes('state, version, published_at') || text.includes('SELECT (SELECT count(*)')) {
      const table = text.includes('event_content') ? 'event_content' : text.includes('schedule_entries') ? 'schedule_entries' : 'map_points';
      const resources = this.resourceRows(table);

      if (text.includes('SELECT (SELECT count(*)')) {
        return result([{
          content: this.resourceRows('event_content').size,
          schedule: this.resourceRows('schedule_entries').size,
          map: this.resourceRows('map_points').size
        }]);
      }

      if (text.startsWith('INSERT INTO')) {
        const id = `${table}-${resources.size + 1}`;
        const row = this.adminResourceRow(table, id, values, 1);
        resources.set(id, row);
        return result([row]);
      }

      if (text.startsWith('UPDATE')) {
        const id = String(values[text.includes('SET state = $1') ? 1 : text.includes('deleted_at = now()') ? 0 : values.length - 2]);
        const expectedVersion = Number(values.at(-1));
        const row = resources.get(id);
        const currentVersion = Number(row?.version);
        if (!row || currentVersion !== expectedVersion) return result([]);

        row.version = expectedVersion + 1;
        if (text.includes('deleted_at = now()')) {
          resources.delete(id);
          return result([{ id }]);
        }
        if (text.includes('SET state = $1')) {
          row.state = values[0];
          row.publishedAt = values[0] === 'published' ? '2026-09-23T00:00:00.000Z' : null;
        } else {
          Object.assign(row, this.adminResourceRow(table, id, values, currentVersion + 1));
        }
        return result([row]);
      }

      if (text.startsWith('SELECT')) return result([...resources.values()]);
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

    if (text.includes('SELECT id, full_name, email, phone, unit_or_organization, personnel_type, military_rank, service_status FROM participants')) {
      const found = this.participants.get(String(values[0]));
      return result(found ? [found] : []);
    }

    if (text.includes('INSERT INTO participants')) {
      const id = crypto.randomUUID();
      const row = { id, full_name: values[0], email: values[1], phone: values[2], unit_or_organization: values[3], personnel_type: values[4], military_rank: values[5], service_status: values[6] };
      this.participants.set(String(values[1]), row);
      return result([{ id }]);
    }

    if (text.includes('INSERT INTO registration_consents')) {
      return result([]);
    }

    if (text.includes('SELECT id, full_name, military_rank, phone, card_image_filename FROM participants WHERE id = $1')) {
      const found = [...this.participants.values()].find((row) => row.id === values[0]);
      return result(found ? [found] : []);
    }

    if (text.includes('FROM participants') && text.includes('WHERE phone IS NOT NULL')) {
      const rows = [...this.participants.values()].filter((row) => Boolean(row.phone));
      return result(rows);
    }

    if (text.includes('UPDATE participants SET card_image_filename')) {
      const row = [...this.participants.values()].find((candidate) => candidate.id === values[1]);
      if (row) row.card_image_filename = values[0];
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

  private resourceRows(table: string) {
    let rows = this.adminResources.get(table);
    if (!rows) {
      rows = new Map();
      this.adminResources.set(table, rows);
    }
    return rows;
  }

  private adminResourceRow(table: string, id: string, values: unknown[], version: number): Record<string, unknown> {
    const base = {
      id,
      state: 'draft',
      version,
      publishedAt: null,
      createdAt: '2026-09-23T00:00:00.000Z',
      updatedAt: '2026-09-23T00:00:00.000Z'
    };
    if (table === 'event_content') return { ...base, contentKey: values[0], title: values[1], body: values[2] };
    if (table === 'schedule_entries') return { ...base, title: values[0], description: values[1], startsAt: values[2], endsAt: values[3], location: values[4] };
    return { ...base, label: values[0], description: values[1], latitude: values[2], longitude: values[3] };
  }
}

function diplomaGrade(participant: Record<string, unknown>) {
  if (participant.personnel_type !== 'militar') return 'Señor/a';
  const rank = String(participant.military_rank ?? '').trim().replace(/\s*\([^)]*\)\s*$/, '');
  return participant.service_status === 'retiro' ? `${rank} (R)` : rank;
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
