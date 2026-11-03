import argon2 from 'argon2';
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import type { FastifyRequest } from 'fastify';
import { prisma } from '../../db/prisma.js';
import { env } from '../../config/env.js';
import { unauthorized, forbidden, AppError } from '../../utils/errors.js';
import type { LoginInput } from './auth.validation.js';
import { AuditService } from '../../services/audit.service.js';

const audit = new AuditService();
const genericLoginError = () => unauthorized('Invalid username or password.');
const digest = (value: string) => createHash('sha256').update(value).digest('hex');

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: env.nodeEnv === 'production',
    sameSite: 'lax' as const,
    path: '/',
    ...(env.nodeEnv === 'production' ? {} : { domain: undefined }),
  };
}

export async function login(input: LoginInput, request: FastifyRequest) {
  const user = await prisma.user.findUnique({
    where: { username: input.username.trim() },
    select: { id: true, username: true, email: true, password: true, status: true, role: true },
  });
  if (!user) throw genericLoginError();

  const passwordMatches = await argon2.verify(user.password, input.password);
  if (!passwordMatches || user.status !== 'ACTIVE') throw genericLoginError();

  const token = randomBytes(32).toString('base64url');
  const csrfToken = randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + env.sessionTtlSeconds * 1000);
  // Invalidate any prior session identifier supplied by the browser before issuing a new one.
  const prior = request.cookies[env.sessionCookieName];
  if (prior) await prisma.authSession.deleteMany({ where: { token_hash: digest(prior) } });

  await prisma.authSession.create({ data: { user_id: user.id, token_hash: digest(token), csrf_hash: digest(csrfToken), expires_at: expiresAt } });
  await audit.createAudit({ req: request, entity: 'AUTH_LOGIN', entity_id: user.id, actor_id: user.id, action: 'CREATE' });
  return {
    token,
    expiresAt,
    csrfToken,
    user: { id: user.id, username: user.username, email: user.email, role: user.role },
  };
}

export async function requireSession(request: FastifyRequest) {
  const token = request.cookies[env.sessionCookieName];
  if (!token) throw unauthorized();

  const session = await prisma.authSession.findUnique({
    where: { token_hash: digest(token) },
    select: { id: true, user_id: true, csrf_hash: true, expires_at: true, user: { select: { id: true, username: true, email: true, role: true, status: true } } },
  });
  if (!session) throw unauthorized('Session is invalid or expired.');
  if (session.expires_at.getTime() <= Date.now()) {
    await prisma.authSession.deleteMany({ where: { id: session.id } });
    throw unauthorized('Session is invalid or expired.');
  }
  if (session.user.status !== 'ACTIVE') {
    await prisma.authSession.deleteMany({ where: { id: session.id } });
    throw unauthorized('Account is inactive.');
  }
  return { session, user: session.user };
}

export async function rotateCsrfToken(request: FastifyRequest) {
  const { session } = await requireSession(request);
  const token = randomBytes(32).toString('base64url');
  await prisma.authSession.update({ where: { id: session.id }, data: { csrf_hash: digest(token) } });
  return token;
}

export function requireTrustedOrigin(request: FastifyRequest) {
  const origin = request.headers.origin;
  if (!origin || !env.corsOrigins.includes(origin)) {
    throw new AppError(403, 'ORIGIN_INVALID', 'Request origin is not allowed.');
  }
}

export async function logout(request: FastifyRequest) {
  const token = request.cookies[env.sessionCookieName];
  if (!token) return;
  const session = await prisma.authSession.findUnique({ where: { token_hash: digest(token) }, select: { id: true, user_id: true } });
  if (session) {
    await prisma.authSession.deleteMany({ where: { id: session.id } });
    await audit.createAudit({ req: request, entity: 'AUTH_LOGOUT', entity_id: session.id, actor_id: session.user_id, action: 'DELETE' });
  }
}

export async function requireCsrf(request: FastifyRequest, expectedHash: string) {
  const actual = request.headers['x-csrf-token'];
  if (typeof actual !== 'string' || !timingSafeString(digest(actual), expectedHash)) {
    throw new AppError(403, 'CSRF_INVALID', 'CSRF token is invalid.');
  }
}

function timingSafeString(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

export { forbidden };
