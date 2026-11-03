import argon2 from 'argon2';
import { createHmac, randomInt, timingSafeEqual } from 'node:crypto';
import { Prisma } from '../../generated/prisma/client.js';
import { prisma } from '../../db/prisma.js';
import { otpConfig } from '../../config/email.js';
import { sendForgotOtp, sendRegisternOtp } from '../../services/email.service.js';
import { AppError, conflict, badRequest, notFound } from '../../utils/errors.js';
import { ResendRegisterOtpInput, ResetPasswordInput, VerifyEmailInput } from './auth.validation.js';

interface RegisterInput {
  username: string;
  email: string;
  password: string;
}

function hashOtp(userId: string, otp: string): string {
  return createHmac('sha256', otpConfig.secret)
    .update(`${userId}:${otp}`)
    .digest('hex');
}

function safeCompareHex(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left, 'hex');
  const rightBuffer = Buffer.from(right, 'hex');

  return (
    leftBuffer.length === rightBuffer.length &&
    timingSafeEqual(leftBuffer, rightBuffer)
  );
}

function generateOtp(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, '0');
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function normalizeUsername(username: string): string {
  return username.trim();
}

export async function registerUser(input: RegisterInput) {
  const username = normalizeUsername(input.username);
  const email = normalizeEmail(input.email);

  if (!/^[a-zA-Z0-9_.-]{3,32}$/.test(username)) {
    throw badRequest(
      'Username must be 3–32 characters and contain only letters, numbers, dots, underscores, or hyphens.',
    );
  }

  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw badRequest('Please provide a valid email address.');
  }

  if (input.password.length < 8 || input.password.length > 128) {
    throw badRequest('Password must be between 8 and 128 characters.');
  }

  const passwordHash = await argon2.hash(input.password, {
    type: argon2.argon2id,
  });

  const otp = generateOtp();
  let createdUserData: { id: string; username: string; email: string | null };

  try {
    createdUserData = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          username,
          email,
          password: passwordHash,
          status: 'INACTIVE',
          role: 'CUSTOMER',
        },
        select: {
          id: true,
          username: true,
          email: true,
        },
      });

      await tx.oTPVerification.create({
        data: {
          user_id: user.id,
          otp_hash: hashOtp(user.id, otp),
          expires_at: new Date(
            Date.now() + otpConfig.expiresMinutes * 60_000,
          ),
          type: "REGISTER",
        },
      });

      return user;
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw conflict('This username or email address is already registered.');
    }
    throw error;
  }

  try {
    await sendRegisternOtp(createdUserData.username, createdUserData.email || email, otp);
  } catch (error) {
    try {
      await prisma.oTPVerification.deleteMany({ where: { user_id: createdUserData.id } });
      await prisma.user.delete({ where: { id: createdUserData.id } });
    } catch { }

    throw new AppError(
      503,
      'EMAIL_DELIVERY_FAILED',
      'We could not send the verification email. Please try registering again later.',
    );
  }

  return {
    message: 'Registration successful. Check your email for the verification code.',
    user: {
      id: createdUserData.id,
      username: createdUserData.username,
      email: createdUserData.email,
      status: 'INACTIVE' as const,
    },
  };
}

export async function resendEmailOTPRegister(input: ResendRegisterOtpInput) {
  const email = normalizeEmail(input.email);
  const otp = generateOtp();

  const user = await prisma.$transaction(async (tx) => {
    const user_check = await tx.user.findUnique({
      where: { email },
      select: { id: true, email: true, username: true },
    });

    if (!user_check) {
      throw notFound(`Email ${email} not found in database`);
    }

    await tx.oTPVerification.deleteMany({
      where: { user_id: user_check.id, type: "REGISTER" },
    });

    await tx.oTPVerification.create({
      data: {
        user_id: user_check.id,
        otp_hash: hashOtp(user_check.id, otp),
        expires_at: new Date(Date.now() + otpConfig.expiresMinutes * 60_000),
        type: "REGISTER",
      },
    });

    return user_check;
  });

  try {
    await sendRegisternOtp(user.username, email, otp);
  } catch (error) {
    throw new AppError(
      503,
      'EMAIL_DELIVERY_FAILED',
      'We could not send the verification email. Please try registering again later.',
    );
  }

  return {
    message: 'OTP resend successfully. Check your email for the verification code.',
    user: { id: user.id, email },
  };
}

export async function verifyUserEmail(input: VerifyEmailInput) {
  const email = normalizeEmail(input.email);

  if (!/^\d{6}$/.test(input.otp)) {
    throw badRequest('The verification code must contain 6 digits.');
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, status: true, verified_at: true },
  });
  const last_data = user;

  if (!user) {
    throw badRequest('The verification code is invalid or has expired.');
  }

  if (user.verified_at) {
    return { message: 'Your email address has already been verified.', user };
  }

  const verification = await prisma.oTPVerification.findFirst({
    where: { user_id: user.id, consumed_at: null, type: "REGISTER" },
    orderBy: { created_at: 'desc' },
  });

  if (!verification) {
    throw badRequest('The verification code is invalid or has expired.');
  }

  if (verification.expires_at.getTime() <= Date.now()) {
    throw badRequest('The verification code has expired. Please request a new code.');
  }

  if (verification.attempts >= otpConfig.maxAttempts) {
    throw new AppError(
      429,
      'OTP_ATTEMPTS_EXCEEDED',
      'Too many incorrect verification attempts. Please request a new code.',
    );
  }

  const expectedHash = hashOtp(user.id, input.otp);
  const valid = safeCompareHex(verification.otp_hash, expectedHash);

  if (!valid) {
    await prisma.oTPVerification.update({
      where: { id: verification.id },
      data: { attempts: { increment: 1 } },
    });
    throw badRequest('The verification code is incorrect.');
  }

  const updatedUser = await prisma.$transaction(async (tx) => {
    await tx.oTPVerification.delete({ where: { id: verification.id } });
    
    const verified_at = new Date();
    const updated = await tx.user.update({
      where: { id: user.id },
      data: { verified_at, status: 'ACTIVE' },
      select: { id: true, email: true, status: true, verified_at: true }
    });

    return updated;
  });

  return {
    message: 'Your email address has been verified successfully.',
    user: updatedUser,
    last_data
  };
}

export async function forgotPasswordOTP(input: ResendRegisterOtpInput) {
  const email = normalizeEmail(input.email);
  const otp = generateOtp();

  const user = await prisma.$transaction(async (tx) => {
    const user_check = await tx.user.findUnique({
      where: { email },
      select: { id: true, email: true, username: true, status: true },
    });

    if (!user_check) {
      throw notFound(`Email ${email} not found in database`);
    }

    if (user_check.status !== "ACTIVE") {
      throw badRequest(`Your account is not active. Please contact admin.`);
    }

    await tx.oTPVerification.deleteMany({
      where: { user_id: user_check.id, type: "FORGOT_PASSWORD" },
    });

    await tx.oTPVerification.create({
      data: {
        user_id: user_check.id,
        otp_hash: hashOtp(user_check.id, otp),
        expires_at: new Date(Date.now() + otpConfig.expiresMinutes * 60_000),
        type: "FORGOT_PASSWORD",
      },
    });

    return user_check;
  });

  try {
    await sendForgotOtp(user.username, email, otp);
  } catch {
    throw new AppError(
      503,
      'EMAIL_DELIVERY_FAILED',
      'We could not send the verification email. Please try again later.',
    );
  }

  return {
    message: 'OTP sent successfully. Check your email for the verification code.',
    user: { id: user.id, email },
  };
}

async function validateForgotPasswordOtp(email: string, otp: string) {
  if (!/^\d{6}$/.test(otp)) {
    throw badRequest('The verification code must contain 6 digits.');
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (!user) {
    throw badRequest('The verification code is invalid or has expired.');
  }

  const verification = await prisma.oTPVerification.findFirst({
    where: { user_id: user.id, consumed_at: null, type: "FORGOT_PASSWORD" },
    orderBy: { created_at: 'desc' },
  });

  if (!verification) {
    throw badRequest('The verification code is invalid or has expired.');
  }

  if (verification.expires_at.getTime() <= Date.now()) {
    throw badRequest('The verification code has expired. Please request a new code.');
  }

  if (verification.attempts >= otpConfig.maxAttempts) {
    throw new AppError(
      429,
      'OTP_ATTEMPTS_EXCEEDED',
      'Too many incorrect verification attempts. Please request a new code.',
    );
  }

  const expectedHash = hashOtp(user.id, otp);
  const valid = safeCompareHex(verification.otp_hash, expectedHash);

  if (!valid) {
    await prisma.oTPVerification.update({
      where: { id: verification.id },
      data: { attempts: { increment: 1 } },
    });
    throw badRequest('The verification code is incorrect.');
  }

  return { userId: user.id, verificationId: verification.id };
}

export async function verifyForgotPassword(input: VerifyEmailInput) {
  await validateForgotPasswordOtp(input.email, input.otp);
  return {
    message: 'OTP verified successfully. Reset your password now',
  };
}

export async function resetPassword(input: ResetPasswordInput) {
  const email = normalizeEmail(input.email);

  if (input.password !== input.confirm_password) {
    throw badRequest('Password and confirm password do not match.');
  }

  const { userId, verificationId } = await validateForgotPasswordOtp(email, input.otp);

  const passwordHash = await argon2.hash(input.password, {
    type: argon2.argon2id,
  });

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: {
        password: passwordHash,
        verified_at: new Date(),
      },
    });

    await tx.authSession.deleteMany({ where: { user_id: userId } });

    await tx.oTPVerification.delete({
      where: { id: verificationId },
    });
  });

  return {
    message: 'Password has been reset successfully. You can now login.',
  };
}
