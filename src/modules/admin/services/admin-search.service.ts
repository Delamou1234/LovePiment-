import type { Prisma } from '@prisma/client';
import { prisma } from '@/shared/lib/prisma';
import type { AdminSearchResults } from '../types/admin-search';

const LIMIT = 5;

function extraireChiffres(term: string) {
  return term.replace(/\D/g, '');
}

function whereCommandes(term: string): Prisma.OrderWhereInput {
  const chiffres = extraireChiffres(term);
  const or: Prisma.OrderWhereInput[] = [
    { clientNom: { contains: term, mode: 'insensitive' } },
    { clientVille: { contains: term, mode: 'insensitive' } },
  ];

  if (term.length >= 4) {
    or.unshift({ id: { startsWith: term, mode: 'insensitive' } });
  }
  if (chiffres.length >= 4) {
    or.push({ clientTelephone: { contains: chiffres } });
  }

  return { OR: or };
}

function whereClients(term: string): Prisma.CustomerWhereInput {
  const chiffres = extraireChiffres(term);
  const or: Prisma.CustomerWhereInput[] = [
    { nom: { contains: term, mode: 'insensitive' } },
    { email: { contains: term, mode: 'insensitive' } },
  ];

  if (chiffres.length >= 4) {
    or.push({ telephone: { contains: chiffres } });
  }

  return { OR: or };
}

function whereProduits(term: string): Prisma.ProductWhereInput {
  return {
    OR: [
      { nom: { contains: term, mode: 'insensitive' } },
      { slug: { contains: term, mode: 'insensitive' } },
      { marque: { contains: term, mode: 'insensitive' } },
    ],
  };
}

export const adminSearchService = {
  async rechercher(query: string): Promise<AdminSearchResults> {
    const term = query.trim();
    const started = performance.now();

    const [commandes, clients, produits] = await Promise.all([
      prisma.order.findMany({
        where: whereCommandes(term),
        select: {
          id: true,
          clientNom: true,
          clientVille: true,
          statut: true,
          montantTotal: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: LIMIT,
      }),
      prisma.customer.findMany({
        where: whereClients(term),
        select: {
          id: true,
          nom: true,
          email: true,
          telephone: true,
        },
        orderBy: { updatedAt: 'desc' },
        take: LIMIT,
      }),
      prisma.product.findMany({
        where: whereProduits(term),
        select: {
          id: true,
          nom: true,
          slug: true,
          prix: true,
          images: true,
          actif: true,
        },
        orderBy: { updatedAt: 'desc' },
        take: LIMIT,
      }),
    ]);

    return {
      query: term,
      tookMs: Math.round(performance.now() - started),
      commandes: commandes.map((c) => ({
        type: 'commande' as const,
        id: c.id,
        clientNom: c.clientNom,
        clientVille: c.clientVille,
        statut: c.statut,
        montantTotal: Number(c.montantTotal),
        createdAt: c.createdAt.toISOString(),
      })),
      clients: clients.map((c) => ({
        type: 'client' as const,
        id: c.id,
        nom: c.nom,
        email: c.email,
        telephone: c.telephone,
      })),
      produits: produits.map((p) => ({
        type: 'produit' as const,
        id: p.id,
        slug: p.slug,
        nom: p.nom,
        prix: Number(p.prix),
        image: p.images[0] ?? null,
        actif: p.actif,
      })),
    };
  },
};
