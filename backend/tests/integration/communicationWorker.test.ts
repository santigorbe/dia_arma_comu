import { describe, expect, it, vi } from 'vitest';
import { createEmailProvider } from '../../src/modules/communications/emailProvider.js';
import { testEnv } from '../helpers/testEnv.js';

describe('Brevo email provider', () => {
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
