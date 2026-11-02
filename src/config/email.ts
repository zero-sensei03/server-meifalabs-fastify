
import 'dotenv/config';

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

const port = Number(process.env.SMTP_PORT ?? 587);

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('SMTP_PORT must be a valid port number.');
}

const secureValue = process.env.SMTP_SECURE ?? 'false';

if (!['true', 'false'].includes(secureValue)) {
  throw new Error('SMTP_SECURE must be true or false.');
}

export const emailConfig = {
  host: requiredEnv('SMTP_HOST'),
  port,
  secure: secureValue === 'true',
  user: requiredEnv('SMTP_USER'),
  password: requiredEnv('SMTP_PASSWORD'),
  from: requiredEnv('SMTP_FROM'),
};

export const otpConfig = {
  secret: requiredEnv('OTP_SECRET'),
  expiresMinutes: Number(process.env.OTP_EXPIRES_MINUTES ?? 10),
  maxAttempts: Number(process.env.OTP_MAX_ATTEMPTS ?? 5),
};

if (otpConfig.secret.length < 32) {
  throw new Error('OTP_SECRET must contain at least 32 characters.');
}

if (
  !Number.isInteger(otpConfig.expiresMinutes) ||
  otpConfig.expiresMinutes < 1 ||
  otpConfig.expiresMinutes > 60
) {
  throw new Error('OTP_EXPIRES_MINUTES must be between 1 and 60.');
}

if (
  !Number.isInteger(otpConfig.maxAttempts) ||
  otpConfig.maxAttempts < 1 ||
  otpConfig.maxAttempts > 10
) {
  throw new Error('OTP_MAX_ATTEMPTS must be between 1 and 10.');
}
