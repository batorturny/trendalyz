import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient();

// Always use singleton — critical for Vercel serverless (reuses warm instances)
globalForPrisma.prisma = prisma;
