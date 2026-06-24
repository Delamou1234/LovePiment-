import { prisma } from '@/shared/lib/prisma';
import {
  calculerLivraisonEstimee,
  messageNotification,
} from '@/shared/lib/delivery-tracking';
import { restaurerStockPourArticles } from '@/modules/produits/lib/order-stock';
import { revalidateBoutique } from '@/modules/produits/lib/revalidate-boutique';
import type { OrderStatus, OrderSatisfaction, TrackingEventType } from '@prisma/client';

const orderInclude = {
  carrier: true,
  trackingEvents: { orderBy: { createdAt: 'asc' as const } },
  items: {
    include: {
      variante: {
        include: {
          produit: { select: { nom: true, images: true, slug: true } },
        },
      },
    },
  },
};

export class TrackingRepository {
  async trouverParToken(suiviToken: string) {
    return prisma.order.findUnique({
      where: { suiviToken },
      include: orderInclude,
    });
  }

  async trouverParId(id: string) {
    return prisma.order.findUnique({
      where: { id },
      include: orderInclude,
    });
  }

  async listerTransporteurs(actifOnly = true) {
    return prisma.carrier.findMany({
      where: actifOnly ? { actif: true } : undefined,
      orderBy: { nom: 'asc' },
    });
  }

  async creerEvenement(data: {
    orderId: string;
    type?: TrackingEventType;
    statut?: OrderStatus;
    message: string;
    notifier?: boolean;
  }) {
    return prisma.orderTrackingEvent.create({ data });
  }

  async mettreAJourCommande(
    id: string,
    data: {
      statut?: OrderStatus;
      carrierId?: string | null;
      numeroSuivi?: string | null;
      livraisonEstimee?: Date | null;
      livreeLe?: Date | null;
    },
  ) {
    return prisma.order.update({
      where: { id },
      data,
      include: orderInclude,
    });
  }

  async assignerTransporteurDefaut(orderId: string, clientVille: string) {
    const carrier = await prisma.carrier.findFirst({
      where: { actif: true },
      orderBy: { createdAt: 'asc' },
    });

    if (!carrier) return null;

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) return null;

    const livraisonEstimee = calculerLivraisonEstimee(
      order.createdAt,
      clientVille,
      carrier,
    );

    return prisma.order.update({
      where: { id: orderId },
      data: { carrierId: carrier.id, livraisonEstimee },
    });
  }

  async initialiserSuiviCommande(orderId: string, clientVille: string) {
    await this.assignerTransporteurDefaut(orderId, clientVille);
    await this.creerEvenement({
      orderId,
      statut: 'EN_ATTENTE',
      message: 'Commande enregistrée — suivi activé.',
      notifier: true,
    });
  }

  async enregistrerChangementStatut(
    orderId: string,
    statut: OrderStatus,
    options: {
      message?: string;
      carrierId?: string | null;
      numeroSuivi?: string | null;
      notifier?: boolean;
    } = {},
  ) {
    const existing = await prisma.order.findUnique({
      where: { id: orderId },
      include: { carrier: true, items: true },
    });
    if (!existing) throw new Error('Commande introuvable');

    const doitRestaurerStock = statut === 'ANNULEE' && existing.statut !== 'ANNULEE';

    const carrierId =
      options.carrierId !== undefined ? options.carrierId : existing.carrierId;

    const carrier = carrierId
      ? await prisma.carrier.findUnique({ where: { id: carrierId } })
      : null;

    const livraisonEstimee =
      statut === 'LIVREE'
        ? existing.livraisonEstimee
        : calculerLivraisonEstimee(existing.createdAt, existing.clientVille, carrier);

    const livreeLe = statut === 'LIVREE' ? new Date() : existing.livreeLe;

    const message =
      options.message ??
      messageNotification(statut, options.numeroSuivi ?? existing.numeroSuivi, carrier?.nom);

    const order = await prisma.$transaction(async (tx) => {
      if (doitRestaurerStock) {
        await restaurerStockPourArticles(tx, existing.items);
      }

      return tx.order.update({
        where: { id: orderId },
        data: {
          statut,
          carrierId,
          numeroSuivi: options.numeroSuivi ?? existing.numeroSuivi,
          livraisonEstimee,
          livreeLe,
        },
        include: orderInclude,
      });
    });

    if (doitRestaurerStock) {
      revalidateBoutique();
    }

    await this.creerEvenement({
      orderId,
      statut,
      message,
      notifier: options.notifier ?? true,
    });

    if (options.notifier !== false) {
      await this.creerEvenement({
        orderId,
        type: 'NOTIFICATION',
        statut,
        message: `Notification client : ${message}`,
        notifier: true,
      });
    }

    return order;
  }

  /** Confirme le paiement espèces (livreur / admin) — inclut le montant dans le CA. */
  async confirmerPaiementLivraison(orderId: string) {
    const existing = await prisma.order.findUnique({
      where: { id: orderId },
      include: { carrier: true },
    });
    if (!existing) throw new Error('Commande introuvable');
    if (existing.modePaiement !== 'PAIEMENT_LIVRAISON') {
      throw new Error('Cette commande n\'est pas en paiement à la livraison');
    }
    if (existing.statutPaiement === 'REUSSIE') {
      return prisma.order.findUnique({ where: { id: orderId }, include: orderInclude });
    }

    const nouveauStatut =
      existing.statut === 'EN_ATTENTE' ? 'PAYEE' : existing.statut;

    const order = await prisma.order.update({
      where: { id: orderId },
      data: {
        statutPaiement: 'REUSSIE',
        statut: nouveauStatut,
      },
      include: orderInclude,
    });

    const montant = Number(existing.montantTotal).toLocaleString('fr-FR');
    await this.creerEvenement({
      orderId,
      statut: order.statut,
      message: `Paiement espèces confirmé par le livreur — ${montant} GN.`,
      notifier: true,
    });
    await this.creerEvenement({
      orderId,
      type: 'NOTIFICATION',
      statut: order.statut,
      message: `Notification client : paiement reçu, merci pour votre confiance.`,
      notifier: true,
    });

    return order;
  }

  async enregistrerSatisfaction(
    suiviToken: string,
    statut: OrderSatisfaction,
    commentaire?: string,
  ) {
    const existing = await prisma.order.findUnique({
      where: { suiviToken },
    });
    if (!existing) throw new Error('Commande introuvable');
    if (existing.statut !== 'LIVREE') {
      throw new Error('La commande doit être livrée avant de donner votre avis');
    }
    if (existing.satisfactionStatut) {
      throw new Error('Vous avez déjà donné votre avis pour cette commande');
    }

    const libelle = statut === 'SATISFAIT' ? 'satisfait' : 'insatisfait';
    const commentaireNettoye = commentaire?.trim() || null;
    const messageAdmin = commentaireNettoye
      ? `Client ${libelle} — ${existing.clientNom} : « ${commentaireNettoye} »`
      : `Client ${libelle} — ${existing.clientNom}`;

    const order = await prisma.order.update({
      where: { id: existing.id },
      data: {
        satisfactionStatut: statut,
        satisfactionCommentaire: commentaireNettoye,
        satisfactionLe: new Date(),
      },
      include: orderInclude,
    });

    await this.creerEvenement({
      orderId: existing.id,
      type: 'SATISFACTION',
      message: messageAdmin,
      notifier: false,
    });

    return order;
  }

  async listerEvenementsSatisfactionDepuis(depuis: Date, limit = 20) {
    return prisma.orderTrackingEvent.findMany({
      where: {
        type: 'SATISFACTION',
        createdAt: { gt: depuis },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        order: {
          select: {
            id: true,
            clientNom: true,
            clientVille: true,
            satisfactionStatut: true,
            satisfactionCommentaire: true,
            suiviToken: true,
          },
        },
      },
    });
  }

  async listerDernieresSatisfactions(limit = 10) {
    return prisma.orderTrackingEvent.findMany({
      where: { type: 'SATISFACTION' },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        order: {
          select: {
            id: true,
            clientNom: true,
            clientVille: true,
            satisfactionStatut: true,
            satisfactionCommentaire: true,
            suiviToken: true,
          },
        },
      },
    });
  }
}

export const trackingRepository = new TrackingRepository();
