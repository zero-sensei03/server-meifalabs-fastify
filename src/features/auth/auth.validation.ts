
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

export const loginSchema = Type.Object({
  username: Type.String({ minLength: 1, maxLength: 32 }),
  password: Type.String({ minLength: 1, maxLength: 128 }),
}, { additionalProperties: false });
export type LoginInput = Static<typeof loginSchema>;

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

export const resetPasswordSchema = Type.Object(
  {
    email: Type.String({ format: 'email', maxLength: 254 }),
    password: Type.String({ minLength: 8, maxLength: 128 }),
    confirm_password: Type.String({ minLength: 8, maxLength: 128 }),
    otp: Type.String({ pattern: '^\\d{6}$' }),
  },
  { additionalProperties: false },
);

export type ResetPasswordInput = Static<typeof resetPasswordSchema>;
