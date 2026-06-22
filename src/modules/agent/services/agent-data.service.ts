import { prisma } from '@/shared/lib/prisma';
import { normaliserTelephoneGuinee } from '@/modules/notifications/lib/phone';
import { formaterInfosBoutiquePourPrompt } from '@/modules/ia/lib/boutique-context';
import {
  formaterCataloguePourPrompt,
  obtenirCatalogueIa,
} from '@/modules/ia/lib/catalog-context';
import { estPromoActive, prixEffectif } from '@/modules/produits/lib/promo';
import { normaliserRecherche } from '@/shared/lib/search';

export type ProduitAgentDto = {
  slug: string;
  nom: string;
  marque: string | null;
  categorie: string;
  prixGn: number;
  prixCatalogueGn: number;
  enPromo: boolean;
  disponible: boolean;
  stockTotal: number;
  variantes: { label: string; stock: number }[];
  url: string;
  description: string;
};

export type CommandeAgentDto = {
  id: string;
  statut: string;
  statutPaiement: string;
  montantTotalGn: number;
  clientNom: string;
  clientVille: string;
  date: string;
  articles: { nom: string; quantite: number; prixUnitaireGn: number }[];
};

function baseUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000').replace(/\/$/, '');
}

function mapProduitRows(
  const include = {
    categorie: true,
    variantes: {
      select: { taille: true, couleur: true, capacite: true, stock: true },
    },
  } as const;

  if (ids?.length) {
    return prisma.product.findMany({
      where: { id: { in: ids }, actif: true },
      include,
    });
  }

  const q = query?.trim();
  if (!q) {
    return prisma.product.findMany({
      where: { actif: true },
      include,
      take: limit,
      orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }],
    });
  }

  const tokens = normaliserRecherche(q)
    .split(/\s+/)
    .filter((t) => t.length >= 2);

  return prisma.product.findMany({
    where: {
      actif: true,
      OR: [
        { nom: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { marque: { contains: q, mode: 'insensitive' } },
        { slug: { contains: q, mode: 'insensitive' } },
        { categorie: { nom: { contains: q, mode: 'insensitive' } } },
        ...tokens.map((t) => ({ nom: { contains: t, mode: 'insensitive' as const } })),
      ],
    },
    include,
    take: limit,
    orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }],
  });
}

function mapProduitRows(
  rows: Awaited<ReturnType<typeof chargerProduitsDb>>,
): ProduitAgentDto[] {
  return rows.map((p) => {
    const stockTotal = p.variantes.reduce((n, v) => n + v.stock, 0);
    const prixCatalogue = Number(p.prix);
    const enPromo = estPromoActive(p);
    const variantes = p.variantes.map((v) => ({
      label: [v.capacite, v.taille, v.couleur].filter(Boolean).join(' · ') || 'standard',
      stock: v.stock,
    }));

    return {
      slug: p.slug,
      nom: p.nom,
      marque: p.marque,
      categorie: p.categorie.nom,
      prixGn: prixEffectif(p),
      prixCatalogueGn: prixCatalogue,
      enPromo,
      disponible: stockTotal > 0,
      stockTotal,
      variantes,
      url: `${baseUrl()}/produits/${p.slug}`,
      description: (p.description ?? '').slice(0, 200),
    };
  });
}

export async function rechercherProduitsAgent(query?: string, limit = 12): Promise<ProduitAgentDto[]> {
  const rows = await chargerProduitsDb(undefined, query, limit);
  return mapProduitRows(rows);
}

export async function produitParSlugAgent(slug: string): Promise<ProduitAgentDto | null> {
  const row = await prisma.product.findFirst({
    where: { slug, actif: true },
    include: {
      categorie: true,
      variantes: {
        select: { taille: true, couleur: true, capacite: true, stock: true },
      },
    },
  });
  if (!row) return null;
  return mapProduitRows([row])[0];
}

export async function commandesParTelephoneAgent(
  telephone: string,
  limit = 3,
): Promise<CommandeAgentDto[]> {
  const normalise = normaliserTelephoneGuinee(telephone);
  if (!normalise) return [];

  const suffix = normalise.slice(-9);
  const commandes = await prisma.order.findMany({
    where: {
      OR: [
        { clientTelephone: { contains: suffix } },
        { clientTelephone: { contains: normalise } },
      ],
    },
    include: {
      items: {
        include: {
          variante: {
            include: { produit: { select: { nom: true } } },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

  return commandes.map((c) => ({
    id: c.id,
    statut: c.statut,
    statutPaiement: c.statutPaiement,
    montantTotalGn: Number(c.montantTotal),
    clientNom: c.clientNom,
    clientVille: c.clientVille,
    date: c.createdAt.toISOString(),
    articles: c.items.map((item) => ({
      nom: item.variante.produit.nom,
      quantite: item.quantite,
      prixUnitaireGn: Number(item.prixUnitaire),
    })),
  }));
}

/** Contexte texte + JSON pour l'agent WhatsApp (n8n). */
export async function construireContexteAgent(params: {
  message: string;
  telephone?: string | null;
}) {
  const message = params.message.trim();
  const produits = await rechercherProduitsAgent(message || undefined, 15);
  const catalogueFallback =
    produits.length > 0 ? produits : (await rechercherProduitsAgent(undefined, 12));

  const commandes = params.telephone
    ? await commandesParTelephoneAgent(params.telephone, 3)
    : [];

  const catalogueIa = await obtenirCatalogueIa(120);
  const produitsTexte = formaterCataloguePourPrompt(
    catalogueIa.filter((p) => catalogueFallback.some((f) => f.slug === p.slug)),
  );

  const commandesTexte =
    commandes.length === 0
      ? 'Aucune commande récente pour ce numéro.'
      : commandes
          .map(
            (c) =>
              `- Commande #${c.id.slice(0, 8)} | ${c.statut} | paiement ${c.statutPaiement} | ${c.montantTotalGn.toLocaleString('fr-FR')} GN | ${c.clientVille} | ${c.articles.map((a) => `${a.quantite}x ${a.nom}`).join(', ')}`,
          )
          .join('\n');

  const contexteTexte = [
    formaterInfosBoutiquePourPrompt(),
    '',
    `MESSAGE CLIENT WHATSAPP:\n${message || '(vide)'}`,
    '',
    'PRODUITS PERTINENTS (base KabiShop en temps réel):',
    produitsTexte,
    '',
    params.telephone ? `COMMANDES RÉCENTES (${params.telephone}):` : '',
    params.telephone ? commandesTexte : '',
    '',
    'Consignes: réponds uniquement avec ces données. Prix en GN. Indique rupture de stock si stock=0.',
  ]
    .filter(Boolean)
    .join('\n');

  return {
    contexteTexte,
    produits: catalogueFallback,
    commandes,
    boutique: {
      url: baseUrl(),
      whatsapp: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '224625617377',
    },
  };
}
