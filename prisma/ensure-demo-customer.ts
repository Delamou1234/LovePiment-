import type { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/shared/lib/auth/password';

export const DEFAULT_DEMO_CUSTOMER_EMAIL = 'client@kabishop.com';
export const DEFAULT_DEMO_CUSTOMER_PASSWORD = 'Client2026!';

export function resolveDemoCustomerCredentials() {
  const email = (
    process.env.DEMO_CUSTOMER_EMAIL ??
    process.env.CONTACT_EMAIL ??
    DEFAULT_DEMO_CUSTOMER_EMAIL
  )
    .trim()
    .toLowerCase();
  const password = process.env.DEMO_CUSTOMER_PASSWORD ?? DEFAULT_DEMO_CUSTOMER_PASSWORD;
  const nom = (process.env.DEMO_CUSTOMER_NAME ?? 'Client démo').trim();

  return { email, password, nom };
}

/** Compte client de test pour connexion / mot de passe oublié (idempotent). */
export async function ensureDemoCustomer(prisma: PrismaClient) {
  const { email, password, nom } = resolveDemoCustomerCredentials();

  const existing = await prisma.customer.findUnique({ where: { email } });
  if (existing?.passwordHash) {
    console.log(`ℹ️  Compte client démo déjà présent : ${email}`);
    return existing;
  }

  const customer = await prisma.customer.upsert({
    where: { email },
    update: {
      nom,
      passwordHash: hashPassword(password),
    },
    create: {
      email,
      nom,
      passwordHash: hashPassword(password),
      codeParrainage: `KABI${email.split('@')[0].slice(0, 6).toUpperCase().padEnd(6, '0')}`,
    },
  });

  console.log(`✅ Compte client démo créé : ${email}`);
  console.log(`   Mot de passe : ${password}`);
  return customer;
}
