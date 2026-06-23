import type { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/shared/lib/auth/password';

export const DEFAULT_DEMO_COURIER_EMAIL = 'livreur@kabishop.com';
export const DEFAULT_DEMO_COURIER_PASSWORD = 'Livreur2026!';

export function resolveDemoCourierCredentials() {
  const email = (process.env.DEMO_COURIER_EMAIL ?? DEFAULT_DEMO_COURIER_EMAIL)
    .trim()
    .toLowerCase();
  const password = process.env.DEMO_COURIER_PASSWORD ?? DEFAULT_DEMO_COURIER_PASSWORD;
  const nom = (process.env.DEMO_COURIER_NAME ?? 'Mamadou Diallo').trim();

  return { email, password, nom };
}

/** Compte livreur de démo pour tests (idempotent). */
export async function ensureDemoCourier(prisma: PrismaClient) {
  const { email, password, nom } = resolveDemoCourierCredentials();

  const existing = await prisma.courier.findUnique({ where: { email } });
  if (existing?.passwordHash) {
    console.log(`ℹ️  Compte livreur démo déjà présent : ${email}`);
    return existing;
  }

  const courier = await prisma.courier.upsert({
    where: { email },
    update: {
      nom,
      passwordHash: hashPassword(password),
      telephone: '+224 620 11 22 33',
      whatsapp: '+224 620 11 22 33',
      typeEngin: 'MOTO',
      immatriculation: 'GN-1234-AB',
      numeroCni: 'CNI-2024-001234',
      quartierBase: 'Taouyah',
      commune: 'Ratoma',
      verifie: true,
      actif: true,
    },
    create: {
      email,
      nom,
      passwordHash: hashPassword(password),
      telephone: '+224 620 11 22 33',
      whatsapp: '+224 620 11 22 33',
      typeEngin: 'MOTO',
      immatriculation: 'GN-1234-AB',
      numeroCni: 'CNI-2024-001234',
      quartierBase: 'Taouyah',
      commune: 'Ratoma',
      verifie: true,
      actif: true,
    },
  });

  console.log(`✅ Livreur démo : ${email} / ${password}`);
  return courier;
}
