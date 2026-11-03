import 'dotenv/config';
import argon2 from 'argon2';
import { PrismaClient } from '../../src/generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';

const databaseUrl = process.env.DATABASE_URL;
const username = process.env.SUPERADMIN_USERNAME?.trim();
const password = process.env.SUPERADMIN_PASSWORD;
if (!databaseUrl) throw new Error('DATABASE_URL is required.');
if (!username || !/^[a-zA-Z0-9_.-]{3,32}$/.test(username)) throw new Error('SUPERADMIN_USERNAME must be 3–32 valid characters.');
if (!password || password.length < 12 || password.length > 128) throw new Error('SUPERADMIN_PASSWORD must be 12–128 characters.');

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });
try {
  const existing = await prisma.user.findUnique({ where: { username }, select: { id: true } });
  if (existing) {
    console.info('Superadmin already exists; credentials were left unchanged.');
  } else {
    const passwordHash = await argon2.hash(password, { type: argon2.argon2id });
    await prisma.user.create({ data: { username, password: passwordHash, status: 'ACTIVE', verified_at: new Date(), role: 'SUPERADMIN' } });
    console.info('Superadmin bootstrap account created.');
  }
} finally {
  await prisma.$disconnect();
}
