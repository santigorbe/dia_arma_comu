import { describe, expect, it, vi } from 'vitest';
import { createEmailProvider } from '../../src/modules/communications/emailProvider.js';
import { processNextCommunicationJob } from '../../src/modules/communications/communicationWorker.js';
import { registerParticipant } from '../../src/modules/registration/registrationService.js';
import { FakeDb } from '../helpers/fakeDb.js';
import { testEnv } from '../helpers/testEnv.js';

const registration = {
  requestIdempotencyKey: '550e8400-e29b-41d4-a716-446655440002',
  visitId: '550e8400-e29b-41d4-a716-446655440000',
  fullName: 'Participant Name',
  email: 'person@example.test',
  personnelType: 'civil' as const,
  consent: { accepted: true as const, version: 'consent-2026-09' }
};

describe('registration confirmation outbox worker', () => {
  it('claims, renders from the currently published schedule, and records simulated delivery', async () => {
    const db = new FakeDb();
    db.publicSchedule = [{ id: 'schedule-1', title: 'Published activity', description: null, startsAt: '2026-09-29T09:00:00.000Z', endsAt: '2026-09-29T10:00:00.000Z', location: 'Published location' }];
    await registerParticipant(testEnv, db, registration);
    const sent: Array<{ to: string; text: string }> = [];
    const provider = { mode: 'simulation' as const, send: vi.fn(async (email) => { sent.push(email); return {}; }) };

    await expect(processNextCommunicationJob(db, provider, 'worker-test', () => {})).resolves.toBe(true);

    expect(sent).toEqual([expect.objectContaining({ to: 'person@example.test', text: expect.stringContaining('Published activity') })]);
    expect(db.outboxJobs[0]).toMatchObject({ state: 'delivered', attempts: 1, last_error_code: null });
    expect(db.communicationAttempts).toEqual([{ job_id: 'job-1', attempt_number: 1, provider_mode: 'simulation', outcome: 'delivered', sanitized_summary: '{"providerId":null}' }]);
  });

  it('records a retryable failure without exposing recipient or message data in logs', async () => {
    const db = new FakeDb();
    await registerParticipant(testEnv, db, registration);
    const logs: Record<string, unknown>[] = [];
    const provider = { mode: 'simulation' as const, send: vi.fn(async () => { throw new Error('provider failed for person@example.test'); }) };

    await expect(processNextCommunicationJob(db, provider, 'worker-test', (record) => logs.push(record))).resolves.toBe(true);

    expect(db.outboxJobs[0]).toMatchObject({ state: 'retryable_failed', attempts: 1, last_error_code: 'delivery_failed' });
    expect(db.communicationAttempts[0]).toMatchObject({ outcome: 'failed', sanitized_summary: '{"errorCode":"delivery_failed"}' });
    expect(JSON.stringify(logs)).not.toContain('person@example.test');
  });

  it('records Brevo status errors for retry', async () => {
    const db = new FakeDb();
    await registerParticipant(testEnv, db, registration);
    const provider = { mode: 'real' as const, send: vi.fn(async () => { throw new Error('brevo_429'); }) };

    await expect(processNextCommunicationJob(db, provider, 'worker-test', () => {})).resolves.toBe(true);

    expect(db.outboxJobs[0]).toMatchObject({ state: 'retryable_failed', last_error_code: 'brevo_429' });
    expect(db.communicationAttempts[0]).toMatchObject({ outcome: 'failed', sanitized_summary: '{"errorCode":"brevo_429"}' });
  });

  it('does not invoke a provider when no due job is available', async () => {
    const provider = { mode: 'simulation' as const, send: vi.fn() };
    await expect(processNextCommunicationJob(new FakeDb(), provider, 'worker-test')).resolves.toBe(false);
    expect(provider.send).not.toHaveBeenCalled();
  });

  it('uses the Brevo HTTP adapter only in configured real mode', async () => {
    const request = vi.fn(async () => new Response(JSON.stringify({ messageId: 'brevo-message-1' }), { status: 200 }));
    const provider = createEmailProvider({ ...testEnv, EMAIL_PROVIDER_MODE: 'real', BREVO_API_KEY: 'test-key', BREVO_FROM_EMAIL: 'events@example.test' }, request);

    await expect(provider.send({ to: 'person@example.test', subject: 'Test', text: 'Test body' })).resolves.toEqual({ providerId: 'brevo-message-1' });
    expect(request).toHaveBeenCalledWith('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'api-key': 'test-key', 'Content-Type': 'application/json' },
      body: JSON.stringify({ sender: { email: 'events@example.test' }, to: [{ email: 'person@example.test' }], subject: 'Test', textContent: 'Test body' })
    });
  });

  it('surfaces Brevo non-2xx responses as status-only errors', async () => {
    const request = vi.fn(async () => new Response(null, { status: 429 }));
    const provider = createEmailProvider({ ...testEnv, EMAIL_PROVIDER_MODE: 'real', BREVO_API_KEY: 'test-key', BREVO_FROM_EMAIL: 'events@example.test' }, request);

    await expect(provider.send({ to: 'person@example.test', subject: 'Test', text: 'Test body' })).rejects.toThrow('brevo_429');
  });

  it('encodes PDF attachments only in the Brevo payload', async () => {
    let requestBody = '';
    const request = vi.fn<typeof fetch>(async (_url, init) => {
      requestBody = String(init?.body);
      return new Response(JSON.stringify({ messageId: 'brevo-message-1' }), { status: 200 });
    });
    const provider = createEmailProvider({ ...testEnv, EMAIL_PROVIDER_MODE: 'real', BREVO_API_KEY: 'test-key', BREVO_FROM_EMAIL: 'events@example.test' }, request);

    await provider.send({ to: 'person@example.test', subject: 'Diploma', text: 'Attached.', attachments: [{ name: 'diploma.pdf', content: Buffer.from('%PDF-test') }] });

    expect(JSON.parse(requestBody)).toMatchObject({ attachment: [{ name: 'diploma.pdf', content: Buffer.from('%PDF-test').toString('base64') }] });
  });
});
