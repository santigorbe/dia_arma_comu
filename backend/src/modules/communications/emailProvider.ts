import type { AppEnv } from '../../config/env.js';

export type EmailAttachment = { name: string; content: Buffer };

export type EmailMessage = {
  to: string;
  subject: string;
  text: string;
  attachments?: EmailAttachment[];
};
export type RegistrationConfirmationEmail = EmailMessage;

export type EmailProvider = {
  mode: 'simulation' | 'real';
  send(email: EmailMessage): Promise<{ providerId?: string }>;
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
        body: JSON.stringify({
          sender: { email: env.BREVO_FROM_EMAIL },
          to: [{ email: email.to }],
          subject: email.subject,
          textContent: email.text,
          attachment: email.attachments?.map((attachment) => ({ name: attachment.name, content: attachment.content.toString('base64') }))
        })
      });
      if (!response.ok) throw new Error(`brevo_${response.status}`);
      const body = await response.json() as { messageId?: string };
      return { providerId: body.messageId };
    }
  };
}
