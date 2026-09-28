import type { AppEnv } from '../../config/env.js';

export type RegistrationConfirmationEmail = {
  to: string;
  subject: string;
  text: string;
};

export type EmailProvider = {
  mode: 'simulation' | 'real';
  send(email: RegistrationConfirmationEmail): Promise<{ providerId?: string }>;
};

export function createEmailProvider(env: AppEnv, request: typeof fetch = fetch): EmailProvider {
  if (env.EMAIL_PROVIDER_MODE === 'simulation') {
    return { mode: 'simulation', async send() { return {}; } };
  }

  return {
    mode: 'real',
    async send(email) {
      const response = await request('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: { 'api-key': env.BREVO_API_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ sender: { email: env.BREVO_FROM_EMAIL }, to: [{ email: email.to }], subject: email.subject, textContent: email.text })
      });
      if (!response.ok) throw new Error(`brevo_${response.status}`);
      const body = await response.json() as { messageId?: string };
      return { providerId: body.messageId };
    }
  };
}
