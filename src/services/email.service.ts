
import nodemailer from 'nodemailer';
import { emailConfig } from '../config/email.js';

const transporter = nodemailer.createTransport({
  host: emailConfig.host,
  port: emailConfig.port,
  secure: emailConfig.secure,
  auth: {
    user: emailConfig.user,
    pass: emailConfig.password,
  },
  connectionTimeout: 10_000,
  greetingTimeout: 10_000,
  socketTimeout: 15_000,
});

export async function sendVerificationOtp(
  email: string,
  otp: string,
): Promise<void> {
  await transporter.sendMail({
    from: emailConfig.from,
    to: email,
    subject: 'Verify your email address',
    text: [
      'Hello,',
      '',
      `Your verification code is ${otp}.`,
      'This code expires in 10 minutes.',
      'If you did not request this code, you can ignore this email.',
    ].join('\n'),
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto">
        <h2>Verify your email address</h2>
        <p>Use the verification code below to complete your registration.</p>
        <p style="font-size:32px;font-weight:bold;letter-spacing:8px">
          ${otp}
        </p>
        <p>This code expires in 10 minutes.</p>
        <p>If you did not request this code, you can ignore this email.</p>
      </div>
    `,
  });
}
