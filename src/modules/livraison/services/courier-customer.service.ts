import { cookies } from 'next/headers';
import { prisma } from '@/shared/lib/prisma';
import { genererCodeParrainage } from '@/modules/marketing/lib/referral-code';
import {
  createSessionToken,
  COURIER_SESSION_COOKIE,
  getCourierSession,
} from '@/shared/lib/auth/session';
import { getSessionCookieOptions } from '@/shared/lib/auth/session-cookie-options';
import type { CompteLivreurContext } from '@/modules/compte/types';

type CourierRow = {
  id: string;
  email: string;
  nom: string;
  telephone: string;
  passwordHash: string;
  customerId: string | null;
};

async function chargerLivreur(courierId: string): Promise<CourierRow | null> {
  return prisma.courier.findUnique({
    where: { id: courierId },
    select: {
      id: true,
      email: true,
      nom: true,
      telephone: true,
      passwordHash: true,
      customerId: true,
    },
  });
}

/** Lie un livreur à un compte client (création ou rattachement par e-mail). */
export async function assurerCompteClientPourLivreur(courierId: string) {
  const courier = await chargerLivreur(courierId);
  if (!courier) return null;

  if (courier.customerId) {
    const lie = await prisma.customer.findUnique({ where: { id: courier.customerId } });
    if (lie) return lie;
  }

  const email = courier.email.trim().toLowerCase();
  const existant = await prisma.customer.findUnique({ where: { email } });

  if (existant) {
    const updateCustomer: { passwordHash?: string } = {};
    if (!existant.passwordHash && courier.passwordHash) {
      updateCustomer.passwordHash = courier.passwordHash;
    }

    const customer =
      Object.keys(updateCustomer).length > 0
        ? await prisma.customer.update({
            where: { id: existant.id },
            data: updateCustomer,
          })
        : existant;

    await prisma.courier.update({
      where: { id: courier.id },
      data: { customerId: customer.id },
    });

    return customer;
  }

  const customer = await prisma.customer.create({
    data: {
      email,
      nom: courier.nom.trim(),
      telephone: courier.telephone.trim(),
      passwordHash: courier.passwordHash,
      codeParrainage: genererCodeParrainage(),
    },
  });

  await prisma.courier.update({
    where: { id: courier.id },
    data: { customerId: customer.id },
  });

  return customer;
}

/** Synchronise le mot de passe client quand l'admin change celui du livreur. */
export async function synchroniserMotDePasseClient(courierId: string, passwordHash: string) {
  const courier = await prisma.courier.findUnique({
    where: { id: courierId },
    select: { customerId: true },
  });
  if (!courier?.customerId) return;

  await prisma.customer.update({
    where: { id: courier.customerId },
    data: { passwordHash },
  });
}

const STATUTS_LIVRAISON_EN_COURS = ['PAYEE', 'EN_PREPARATION', 'EXPEDIEE'] as const;

/** Détecte si le client connecté est aussi livreur (session livreur ou liaison customerId). */
export async function resoudreContexteLivreurClient(
  customerId: string,
): Promise<CompteLivreurContext | null> {
  const sessionLivreur = await getCourierSession();
  let courier =
    sessionLivreur?.id != null
      ? await prisma.courier.findFirst({
          where: { id: sessionLivreur.id, customerId, actif: true },
          select: { id: true, nom: true },
        })
      : null;

  if (!courier) {
    courier = await prisma.courier.findFirst({
      where: { customerId, actif: true },
      select: { id: true, nom: true },
    });
  }

  if (!courier) return null;

  const livraisonsEnCours = await prisma.order.count({
    where: {
      courierId: courier.id,
      statut: { in: [...STATUTS_LIVRAISON_EN_COURS] },
    },
  });

  return {
    id: courier.id,
    nom: courier.nom,
    livraisonsEnCours,
  };
}

/** Pose le cookie livreur si le client est rattaché à un compte livreur actif. */
export async function assurerSessionLivreurPourClient(
  customerId: string,
): Promise<CompteLivreurContext | null> {
  const context = await resoudreContexteLivreurClient(customerId);
  if (!context) return null;

  const sessionLivreur = await getCourierSession();
  if (sessionLivreur?.id === context.id) return context;

  const courier = await prisma.courier.findFirst({
    where: { id: context.id, customerId, actif: true },
    select: { id: true, email: true, nom: true },
  });
  if (!courier) return null;

  const token = createSessionToken({
    id: courier.id,
    email: courier.email,
    name: courier.nom,
    role: 'courier',
  });
  const cookieStore = await cookies();
  cookieStore.set(COURIER_SESSION_COOKIE, token, getSessionCookieOptions());

  return context;
}
