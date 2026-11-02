
import type { FastifyInstance } from 'fastify';
import { registerUser, verifyUserEmail } from './auth.service.js';
import { successResponse } from '../../utils/response.js';
import { registerSchema, resendRegisterOtpSchema, verifyEmailSchema } from './auth.validation.js';
import { registerController, resendOtpRegisterController, verifyRegisterController } from './auth.controller.js';

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
  app.post<{ Body: RegisterBody }>(
    '/register/otp-resend',
    {  schema: { body: resendRegisterOtpSchema } },
    resendOtpRegisterController
  );

  app.post<{ Body: VerifyEmailBody }>(
    '/register/otp-verify',
    { schema: { body: verifyEmailSchema } },
    verifyRegisterController
  );
}
