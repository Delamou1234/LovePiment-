import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { ensureDefaultAdmin } from './ensure-admin';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL manquant — vérifiez .env ou .env.local');
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

ensureDefaultAdmin(prisma)
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
