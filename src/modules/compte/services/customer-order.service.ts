import { prisma } from '@/shared/lib/prisma';
import { evaluerAnnulationCommande } from '@/modules/commandes/lib/order-cancel-rules';
import { trackingService } from '@/modules/livraison/services/tracking.service';
import { marketingService } from '@/modules/marketing/services/marketing.service';
import type { CustomerOrderDetail } from '@/modules/compte/types';

function libelleVariante(v: {
  taille: string | null;
  couleur: string | null;
  capacite: string | null;
}): string | null {
  const parts = [v.taille, v.couleur, v.capacite].filter(Boolean);
  return parts.length > 0 ? parts.join(' · ') : null;
}

function serialiserDetail(order: {
  id: string;
  statut: string;
  statutPaiement: string;
  modePaiement: string;
  montantTotal: unknown;
  sousTotal: unknown;
  fraisLivraison: unknown;
  remiseCoupon: unknown;
  remisePoints: unknown;
  remiseParrainage: unknown;
  pointsUtilises: number;
  createdAt: Date;
  suiviToken: string;
  clientNom: string;
  clientTelephone: string;
  clientAdresse: string;
  clientVille: string;
  items: {
    id: string;
    quantite: number;
    prixUnitaire: unknown;
    variante: {
      taille: string | null;
      couleur: string | null;
      capacite: string | null;
      produit: { nom: string; images: string[]; slug: string };
    };
  }[];
}): CustomerOrderDetail {
  const annulation = evaluerAnnulationCommande(order);

  return {
    id: order.id,
    statut: order.statut,
    statutPaiement: order.statutPaiement,
    modePaiement: order.modePaiement,
    montantTotal: Number(order.montantTotal),
    sousTotal: order.sousTotal != null ? Number(order.sousTotal) : null,
    fraisLivraison: order.fraisLivraison != null ? Number(order.fraisLivraison) : null,
    remiseCoupon: Number(order.remiseCoupon),
    remisePoints: Number(order.remisePoints),
    remiseParrainage: Number(order.remiseParrainage),
    pointsUtilises: order.pointsUtilises,
    createdAt: order.createdAt.toISOString(),
    suiviToken: order.suiviToken,
    clientNom: order.clientNom,
    clientTelephone: order.clientTelephone,
    clientAdresse: order.clientAdresse,
    clientVille: order.clientVille,
    items: order.items.map((item) => ({
      id: item.id,
      quantite: item.quantite,
      prixUnitaire: Number(item.prixUnitaire),
      produit: {
        nom: item.variante.produit.nom,
        slug: item.variante.produit.slug,
        image: item.variante.produit.images[0] ?? null,
      },
      variante: {
        label: libelleVariante(item.variante),
      },
    })),
    peutAnnuler: annulation.peutAnnuler,
    raisonNonAnnulation: annulation.raison,
  };
}

export class CustomerOrderService {
  async trouverPourClient(customerId: string, orderId: string) {
    return prisma.order.findFirst({
      where: { id: orderId, customerId },
      include: {
        items: {
          include: {
            variante: {
              include: {
                produit: { select: { nom: true, images: true, slug: true } },
              },
            },
          },
        },
      },
    });
  }

  async obtenirDetail(customerId: string, orderId: string): Promise<CustomerOrderDetail | null> {
    const order = await this.trouverPourClient(customerId, orderId);
    if (!order) return null;
    return serialiserDetail(order);
  }

  async annuler(
    customerId: string,
    orderId: string,
  ): Promise<'ok' | 'not_found' | 'forbidden' | 'invalid'> {
    const order = await this.trouverPourClient(customerId, orderId);
    if (!order) return 'not_found';

    const annulation = evaluerAnnulationCommande(order);
    if (!annulation.peutAnnuler) return 'forbidden';

    await prisma.$transaction(async (tx) => {
      for (const item of order.items) {
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: { stock: { increment: item.quantite } },
        });
      }

      await marketingService.annulerEffetsCommande(tx, order);

      const statutPaiement =
        order.statutPaiement === 'REUSSIE' && order.modePaiement === 'CINETPAY'
          ? 'REMBOURSEE'
          : order.statutPaiement === 'EN_ATTENTE'
            ? 'ECHOUEE'
            : undefined;

      if (statutPaiement) {
        await tx.order.update({
          where: { id: orderId },
          data: { statutPaiement },
        });
      }
    });

    await trackingService.mettreAJourStatut(orderId, 'ANNULEE', {
      message: 'Commande annulée à votre demande.',
      notifier: true,
    });

    return 'ok';
  }
}

export const customerOrderService = new CustomerOrderService();
