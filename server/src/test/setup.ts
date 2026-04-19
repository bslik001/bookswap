import dotenv from 'dotenv';
import { beforeAll, beforeEach, afterAll } from 'vitest';

// Charge .env.test AVANT tout import qui depend de env.ts.
// override: true car Vite peut precharger .env avant les setupFiles.
dotenv.config({ path: '.env.test', override: true });
process.env.NODE_ENV = 'test';

// Garde-fou : refuser de tourner contre une base non-test (les tests truncate-tout).
const dbUrl = process.env.DATABASE_URL ?? '';
const isLocal = /@(localhost|127\.0\.0\.1|host\.docker\.internal|postgres)(:|\/)/.test(dbUrl);
const looksLikeTestDb = /test/i.test(new URL(dbUrl).pathname);
if (!isLocal || !looksLikeTestDb) {
  throw new Error(
    `Refus d'executer les tests : DATABASE_URL ne pointe pas vers une base locale de test (${dbUrl}). Verifiez .env.test.`,
  );
}

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
