import { prisma } from '@/shared/lib/prisma';
import { estPromoActive } from '@/modules/produits/lib/promo';

export type OrderItemInput = {
  variantId: string;
  quantite: number;
  prixUnitaire?: number;
};

export type OrderItemResolved = {
  variantId: string;
  quantite: number;
  prixUnitaire: number;
};

const MAX_LIGNES = 40;
const MAX_QUANTITE_LIGNE = 100;

function prixUnitaireServeur(
  variant: {
    prix: { toString(): string } | null;
    produit: {
      actif: boolean;
      nom: string;
      prix: { toString(): string };
      prixPromo: { toString(): string } | null;
      promoDebut: Date | null;
      promoFin: Date | null;
    };
  },
): number {
  const produit = variant.produit;
  const prixCatalogue =
    variant.prix != null ? Number(variant.prix) : Number(produit.prix);

  if (estPromoActive(produit) && produit.prixPromo != null) {
    return Number(produit.prixPromo);
  }
  return prixCatalogue;
}

/**
 * Résout les prix depuis la base — ne jamais faire confiance au client pour le montant.
 */
export async function validateAndResolveOrderItems(
  items: OrderItemInput[],
): Promise<OrderItemResolved[]> {
  if (!items.length) {
    throw new Error('La commande doit contenir au moins un article');
  }
  if (items.length > MAX_LIGNES) {
    throw new Error(`Maximum ${MAX_LIGNES} articles par commande`);
  }

  const variantIds = [...new Set(items.map((i) => i.variantId))];
  const variants = await prisma.productVariant.findMany({
    where: { id: { in: variantIds } },
    include: {
      produit: {
        select: {
          actif: true,
          nom: true,
          prix: true,
          prixPromo: true,
          promoDebut: true,
          promoFin: true,
        },
      },
    },
  });

  const byId = new Map(variants.map((v) => [v.id, v]));
  const resolved: OrderItemResolved[] = [];

  for (const item of items) {
    if (!Number.isInteger(item.quantite) || item.quantite < 1 || item.quantite > MAX_QUANTITE_LIGNE) {
      throw new Error('Quantité invalide pour un article');
    }

    const variant = byId.get(item.variantId);
    if (!variant) {
      throw new Error('Un article de votre panier n\'existe plus. Actualisez la page.');
    }
    if (!variant.produit.actif) {
      throw new Error(`« ${variant.produit.nom} » n'est plus disponible à la vente.`);
    }
    if (variant.stock < item.quantite) {
      throw new Error(`Stock insuffisant pour « ${variant.produit.nom} ».`);
    }

    const prixUnitaire = prixUnitaireServeur(variant);
    if (!Number.isFinite(prixUnitaire) || prixUnitaire <= 0) {
      throw new Error(`Prix invalide pour « ${variant.produit.nom} ».`);
    }

    resolved.push({
      variantId: item.variantId,
      quantite: item.quantite,
      prixUnitaire: Math.round(prixUnitaire),
    });
  }

  return resolved;
}
