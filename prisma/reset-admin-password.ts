import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });
config({ path: resolve(process.cwd(), '.env') });

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { hashPassword } from '../src/shared/lib/auth/password';
import { resolveAdminSeedCredentials } from './ensure-admin';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL manquant — vérifiez .env ou .env.local');
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

async function main() {
  const admins = await prisma.adminUser.findMany({
    select: { id: true, email: true, actif: true, nom: true },
  });

  console.log('Comptes admin en base :');
  for (const admin of admins) {
    console.log(`  - ${admin.email} (${admin.nom}) actif=${admin.actif}`);
  }

  const { email, password, nom } = resolveAdminSeedCredentials();

  // Supprime les anciens comptes admin (hors compte officiel du projet)
  const removed = await prisma.adminUser.deleteMany({
    where: { email: { not: email } },
  });
  if (removed.count > 0) {
    console.log(`🗑️  ${removed.count} ancien(s) compte(s) admin supprimé(s)`);
  }

  const updated = await prisma.adminUser.upsert({
    where: { email },
    update: {
      passwordHash: hashPassword(password),
      actif: true,
      nom,
    },
    create: {
      email,
      nom,
      passwordHash: hashPassword(password),
      actif: true,
    },
  });

  console.log(`\n✅ Mot de passe synchronisé pour : ${updated.email}`);
  console.log(`   Mot de passe : ${password}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
