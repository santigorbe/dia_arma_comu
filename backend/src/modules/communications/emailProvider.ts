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
      const response = await request('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: env.RESEND_FROM_EMAIL, to: [email.to], subject: email.subject, text: email.text })
      });
      if (!response.ok) throw new Error(`resend_${response.status}`);
      const body = await response.json() as { id?: string };
      return { providerId: body.id };
    }
  };
}
