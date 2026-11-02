import 'dotenv/config';

const validLogLevels = [
  'fatal',
  'error',
  'warn',
  'info',
  'debug',
  'trace',
  'silent',
] as const;

type LogLevel = (typeof validLogLevels)[number];

function readString(name: string, fallback: string): string {
  const value = process.env[name]?.trim() || fallback;

  if (!value) {
    throw new Error(`${name} cannot be empty`);
  }

  return value;
}

function readPositiveInteger(name: string, fallback: number): number {
  const raw = process.env[name];

  if (raw === undefined || raw.trim() === '') {
    return fallback;
  }

  const value = Number(raw);

  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new Error(`${name} must be a positive integer`);
  }

  return value;
}

const nodeEnv = readString('NODE_ENV', 'development');

if (!['development', 'test', 'production'].includes(nodeEnv)) {
  throw new Error('NODE_ENV must be development, test, or production');
}

const logLevel = readString('LOG_LEVEL', 'info');

if (!validLogLevels.includes(logLevel as LogLevel)) {
  throw new Error('LOG_LEVEL is invalid');
}

const corsOrigins = readString(
  'CORS_ORIGINS',
  'http://localhost:5173',
).split(',').map((item) => {
  const origin = item.trim();

  if (!origin || origin === '*') {
    throw new Error('CORS_ORIGINS must contain explicit origins');
  }

  let parsed: URL;

  try {
    parsed = new URL(origin);
  } catch {
    throw new Error(`Invalid CORS origin: ${origin}`);
  }

  if (
    !['http:', 'https:'].includes(parsed.protocol) ||
    parsed.origin !== origin
  ) {
    throw new Error(`Invalid CORS origin format: ${origin}`);
  }

  if (nodeEnv === 'production' && parsed.protocol !== 'https:') {
    throw new Error('Production CORS origins must use HTTPS');
  }

  return origin;
});

export const env = Object.freeze({
  nodeEnv: nodeEnv as 'development' | 'test' | 'production',
  host: readString('HOST', '127.0.0.1'),
  port: readPositiveInteger('PORT', 3000),
  logLevel: logLevel as LogLevel,
  corsOrigins,
  rateLimitMax: readPositiveInteger('RATE_LIMIT_MAX', 100),
  rateLimitWindow: readString('RATE_LIMIT_WINDOW', '1 minute'),
});
