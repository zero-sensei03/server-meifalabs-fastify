
import type { FastifyInstance } from 'fastify';
import { successResponse } from '../../utils/response.js';
import { registerSchema, ResendRegisterOtpInput, resendRegisterOtpSchema, ResetPasswordInput, resetPasswordSchema, verifyEmailSchema, loginSchema, LoginInput } from './auth.validation.js';
import { forgotPasswordOTPController, registerController, resendOtpRegisterController, resetPasswordController, verifyForgotPasswordOTPController, verifyRegisterController } from './auth.controller.js';
import { login, logout, requireCsrf, requireSession, requireTrustedOrigin, rotateCsrfToken, sessionCookieOptions } from './session.service.js';
import { env } from '../../config/env.js';

interface RegisterBody {
  username: string;
  email: string;
  password: string;
}

interface VerifyEmailBody {
  email: string;
  otp: string;
}

export async function authRoute(app: FastifyInstance): Promise<void> {
  app.post<{ Body: RegisterBody }>(
    '/register',
    { schema: { body: registerSchema } },
    registerController
  );
  app.post<{ Body: LoginInput }>('/login', { schema: { body: loginSchema } }, async (request, reply) => {
    const result = await login(request.body, request);
    reply.setCookie(env.sessionCookieName, result.token, {
      ...sessionCookieOptions(),
      expires: result.expiresAt,
      maxAge: env.sessionTtlSeconds,
    });
    return reply.send(successResponse('Login successful.', { user: result.user, csrf_token: result.csrfToken }));
  });
  app.get('/me', async (request, reply) => {
    const { user } = await requireSession(request);
    return reply.send(successResponse('Current user.', { user }));
  });
  app.post('/csrf', async (request, reply) => {
    requireTrustedOrigin(request);
    const csrfToken = await rotateCsrfToken(request);
    return reply.send(successResponse('CSRF token issued.', { csrf_token: csrfToken }));
  });
  app.post('/logout', async (request, reply) => {
    const { session } = await requireSession(request);
    await requireCsrf(request, session.csrf_hash);
    await logout(request);
    reply.clearCookie(env.sessionCookieName, sessionCookieOptions());
    return reply.send(successResponse('Logout successful.', {}));
  });
  app.post<{ Body: ResendRegisterOtpInput }>(
    '/register/otp-resend',
    {  schema: { body: resendRegisterOtpSchema } },
    resendOtpRegisterController
  );
  app.post<{ Body: VerifyEmailBody }>(
    '/register/otp-verify',
    { schema: { body: verifyEmailSchema } },
    verifyRegisterController
  );
  app.post<{ Body: ResendRegisterOtpInput }>(
    '/forgot-password/otp-send',
    {  schema: { body: resendRegisterOtpSchema } },
    forgotPasswordOTPController
  );
  app.post<{ Body: VerifyEmailBody }>(
    '/forgot-password/otp-verify',
    {  schema: { body: verifyEmailSchema } },
    verifyForgotPasswordOTPController
  );
  app.post<{ Body: ResetPasswordInput }>(
    '/forgot-password/reset',
    {  schema: { body: resetPasswordSchema } },
    resetPasswordController
  );
}
