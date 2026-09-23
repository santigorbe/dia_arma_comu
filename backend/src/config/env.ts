import 'dotenv/config';
import { z } from 'zod';

const providerModeSchema = z.enum(['simulation', 'real']);

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  FRONTEND_ORIGIN: z.string().url(),
  BACKEND_ORIGIN: z.string().url(),
  PUBLIC_BASE_URL: z.string().url(),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  AUTH_COOKIE_NAME: z.string().min(1).default('communications_day_admin'),
  AUTH_COOKIE_DOMAIN: z.string().optional().default(''),
  AUTH_COOKIE_SECURE: z.coerce.boolean().default(false),
  AUTH_COOKIE_SAME_SITE: z.enum(['lax', 'strict', 'none']).default('lax'),
  AUTH_COOKIE_MAX_AGE_SECONDS: z.coerce.number().int().positive().default(3600),
  ADMIN_BOOTSTRAP_IDENTIFIER: z.string().min(3).optional().default(''),
  ADMIN_BOOTSTRAP_PASSWORD: z.string().min(12).optional().default(''),
  ACTIVE_CONSENT_VERSION: z.string().min(1),
  CONSENT_TEXT: z.string().min(1),
  EMAIL_PROVIDER_MODE: providerModeSchema.default('simulation'),
  WHATSAPP_PROVIDER_MODE: providerModeSchema.default('simulation'),
  RESEND_API_KEY: z.string().optional().default(''),
  RESEND_FROM_EMAIL: z.string().optional().default(''),
  WHATSAPP_API_URL: z.string().optional().default(''),
  WHATSAPP_ACCESS_TOKEN: z.string().optional().default(''),
  WHATSAPP_SENDER_ID: z.string().optional().default(''),
  WHATSAPP_TEMPLATE_REGISTRATION: z.string().optional().default(''),
  MAP_TILE_URL: z.string().min(1)
});

export type AppEnv = z.infer<typeof envSchema> & {
  allowedOrigins: string[];
  providers: {
    emailReady: boolean;
    whatsappReady: boolean;
  };
};

export function loadEnv(input: NodeJS.ProcessEnv = process.env): AppEnv {
  const parsed = envSchema.safeParse(input);

  if (!parsed.success) {
    const missingValues = parsed.error.issues.map((issue) => issue.path.join('.')).join(', ');
    throw new Error(`Invalid runtime configuration: ${missingValues}`);
  }

  const value = parsed.data;
  const emailReady = value.EMAIL_PROVIDER_MODE === 'simulation' || Boolean(value.RESEND_API_KEY && value.RESEND_FROM_EMAIL);
  const whatsappReady =
    value.WHATSAPP_PROVIDER_MODE === 'simulation' ||
    Boolean(value.WHATSAPP_API_URL && value.WHATSAPP_ACCESS_TOKEN && value.WHATSAPP_SENDER_ID && value.WHATSAPP_TEMPLATE_REGISTRATION);

  if (value.EMAIL_PROVIDER_MODE === 'real' && !emailReady) {
    throw new Error('Invalid runtime configuration: RESEND_API_KEY, RESEND_FROM_EMAIL');
  }

  if (value.WHATSAPP_PROVIDER_MODE === 'real' && !whatsappReady) {
    throw new Error('Invalid runtime configuration: WHATSAPP_API_URL, WHATSAPP_ACCESS_TOKEN, WHATSAPP_SENDER_ID, WHATSAPP_TEMPLATE_REGISTRATION');
  }

  if (value.NODE_ENV === 'production' && !value.AUTH_COOKIE_SECURE) {
    throw new Error('Invalid runtime configuration: AUTH_COOKIE_SECURE must be true in production');
  }
  if (value.AUTH_COOKIE_SAME_SITE === 'none' && !value.AUTH_COOKIE_SECURE) {
    throw new Error('Invalid runtime configuration: AUTH_COOKIE_SECURE must be true when AUTH_COOKIE_SAME_SITE is none');
  }

  return {
    ...value,
    allowedOrigins: [value.FRONTEND_ORIGIN, value.BACKEND_ORIGIN],
    providers: { emailReady, whatsappReady }
  };
}
