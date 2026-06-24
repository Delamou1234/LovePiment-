import type { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/shared/lib/auth/password';

export const DEFAULT_ADMIN_EMAIL = 'admin@lovepiment.gn';
export const DEFAULT_ADMIN_NOM = 'Administrateur Love Piment&';

/** Mot de passe dev si ADMIN_PASSWORD absent (à changer en prod). */
export const DEFAULT_ADMIN_PASSWORD = 'LovePiment2026!';

export function resolveAdminSeedCredentials() {
  const email = (process.env.ADMIN_EMAIL ?? DEFAULT_ADMIN_EMAIL).trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? DEFAULT_ADMIN_PASSWORD;
  const nom = (process.env.ADMIN_NAME ?? DEFAULT_ADMIN_NOM).trim();
  const usingDefaultPassword = !process.env.ADMIN_PASSWORD;

  return { email, password, nom, usingDefaultPassword };
}

/** Crée le compte admin s'il n'existe pas encore (idempotent). */
export async function ensureDefaultAdmin(prisma: PrismaClient) {
  const { email, password, nom, usingDefaultPassword } = resolveAdminSeedCredentials();

  const existing = await prisma.adminUser.findUnique({ where: { email } });
  if (existing) {
    console.log(`ℹ️  Compte admin déjà présent : ${email}`);
    return existing;
  }

  const admin = await prisma.adminUser.create({
    data: {
      email,
      nom,
      passwordHash: hashPassword(password),
      actif: true,
    },
  });

  console.log(`✅ Compte admin créé : ${email}`);
  if (usingDefaultPassword) {
    console.log(`   Mot de passe par défaut : ${DEFAULT_ADMIN_PASSWORD}`);
    console.log('   Définissez ADMIN_PASSWORD dans .env.local en production.');
  } else {
    console.log('   Mot de passe pris depuis ADMIN_PASSWORD.');
  }

  return admin;
}
