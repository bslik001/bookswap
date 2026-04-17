import dotenv from 'dotenv';
import { beforeAll, beforeEach, afterAll } from 'vitest';

// Charge .env.test AVANT tout import qui depend de env.ts
dotenv.config({ path: '.env.test' });
process.env.NODE_ENV = 'test';

import { prisma } from '../lib/prisma';

beforeAll(async () => {
  await prisma.$connect();
});

beforeEach(async () => {
  // Ordre important : respecter les contraintes FK
  await prisma.$transaction([
    prisma.refreshToken.deleteMany(),
    prisma.otpVerification.deleteMany(),
    prisma.notification.deleteMany(),
    prisma.contactRequest.deleteMany(),
    prisma.request.deleteMany(),
    prisma.supply.deleteMany(),
    prisma.book.deleteMany(),
    prisma.user.deleteMany(),
  ]);
});

afterAll(async () => {
  await prisma.$disconnect();
});
