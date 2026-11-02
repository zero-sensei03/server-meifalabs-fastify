
import { Type, type Static } from '@sinclair/typebox';

export const registerSchema = Type.Object(
  {
    username: Type.String({ minLength: 3, maxLength: 32 }),
    email: Type.String({ format: 'email', maxLength: 254 }),
    password: Type.String({ minLength: 8, maxLength: 128 }),
  },
  { additionalProperties: false },
);

export type RegisterInput = Static<typeof registerSchema>;

export const resendRegisterOtpSchema = Type.Object(
  {
    email: Type.String({ format: 'email', maxLength: 254 }),
  },
  { additionalProperties: false },
);

export type ResendRegisterOtpInput = Static<typeof resendRegisterOtpSchema>;

export const verifyEmailSchema = Type.Object(
  {
    email: Type.String({ format: 'email', maxLength: 254 }),
    otp: Type.String({ pattern: '^\\d{6}$' }),
  },
  { additionalProperties: false },
);

export type VerifyEmailInput = Static<typeof verifyEmailSchema>;
