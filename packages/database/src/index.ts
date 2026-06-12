import { PrismaClient } from '@prisma/client';

export * from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var __scientiaPrisma: PrismaClient | undefined;
}

export const prisma: PrismaClient =
  global.__scientiaPrisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  global.__scientiaPrisma = prisma;
}
