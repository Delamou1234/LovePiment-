import { Prisma } from '@prisma/client';

export function isDatabaseConnectionError(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    const code = String(error.code);
    return ['ECONNREFUSED', 'ETIMEDOUT', 'P1001', 'P1002', 'P1008', 'P1017'].includes(code);
  }
  if (error instanceof Error) {
    return /ECONNREFUSED|ETIMEDOUT|connect/i.test(error.message);
  }
  return false;
}
