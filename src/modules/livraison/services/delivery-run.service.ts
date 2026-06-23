import { prisma } from '@/shared/lib/prisma';
import { deliveryNavigationService } from './delivery-navigation.service';
import { trackingService } from './tracking.service';
import type { OrderStatus } from '@prisma/client';

const STATUTS_ELIGIBLES: OrderStatus[] = ['PAYEE', 'EN_PREPARATION', 'EXPEDIEE'];

function sommeMontantsTournee(
  orders: {
    montantTotal: unknown;
    modePaiement: string;
    statutPaiement: string;
  }[],
) {
  const montantTotalGn = orders.reduce((s, o) => s + Number(o.montantTotal), 0);
  const montantEspecesGn = orders
    .filter(
      (o) =>
        o.modePaiement === 'PAIEMENT_LIVRAISON' && o.statutPaiement === 'EN_ATTENTE',
    )
    .reduce((s, o) => s + Number(o.montantTotal), 0);
  return { montantTotalGn, montantEspecesGn };
}

async function recalculerMontantsTournee(runId: string) {
  const commandes = await prisma.order.findMany({
    where: { deliveryRunId: runId },
    select: { montantTotal: true, modePaiement: true, statutPaiement: true },
  });
  const { montantTotalGn, montantEspecesGn } = sommeMontantsTournee(commandes);
  await prisma.deliveryRun.update({
    where: { id: runId },
    data: { montantTotalGn, montantEspecesGn },
  });
}

function labelTournee(id: string, date = new Date()) {
  const jour = date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  return `Tournée ${jour} #${id.slice(-6).toUpperCase()}`;
}

async function validerCommandesPourTournee(orderIds: string[]) {
  if (orderIds.length === 0) {
    throw new Error('Sélectionnez au moins une commande.');
  }

  const orders = await prisma.order.findMany({
    where: { id: { in: orderIds } },
  });

  if (orders.length !== orderIds.length) {
    throw new Error('Une ou plusieurs commandes sont introuvables.');
  }

  for (const order of orders) {
    if (order.statut === 'LIVREE' || order.statut === 'ANNULEE') {
      throw new Error(`La commande ${order.clientNom} est déjà clôturée.`);
    }
    if (order.deliveryRunId) {
      throw new Error(`La commande ${order.clientNom} fait déjà partie d'une tournée.`);
    }
    if (order.courierId) {
      throw new Error(`La commande ${order.clientNom} a déjà un livreur assigné.`);
    }
  }

  return orders;
}

export class DeliveryRunService {
  /** Crée une tournée et assigne plusieurs commandes au même livreur. */
  async creerTournee(data: {
    courierId: string;
    orderIds: string[];
    notes?: string | null;
  }) {
    const courier = await prisma.courier.findFirst({
      where: { id: data.courierId, actif: true },
    });
    if (!courier) throw new Error('Livreur introuvable ou inactif');

    const orders = await validerCommandesPourTournee(data.orderIds);
    const assignedAt = new Date();

    const run = await prisma.deliveryRun.create({
      data: {
        courierId: courier.id,
        statut: 'EN_COURS',
        assignedAt,
        notesAdmin: data.notes?.trim() || null,
      },
    });

    const label = labelTournee(run.id, assignedAt);
    await prisma.deliveryRun.update({
      where: { id: run.id },
      data: { label },
    });

    for (let i = 0; i < orders.length; i++) {
      const order = orders[i]!;
      await deliveryNavigationService.geocoderCommande(order.id);
      await prisma.order.update({
        where: { id: order.id },
        data: {
          courierId: courier.id,
          deliveryRunId: run.id,
          ordreLivraison: i + 1,
          assignedAt,
        },
      });
      await trackingService.mettreAJourStatut(order.id, 'EXPEDIEE', {
        message: `Tournée ${label} — livreur ${courier.nom} (${courier.telephone}).`,
        notifier: true,
      });
    }

    await recalculerMontantsTournee(run.id);

    return prisma.deliveryRun.findUnique({
      where: { id: run.id },
      include: {
        courier: { select: { id: true, nom: true, telephone: true } },
        commandes: {
          select: {
            id: true,
            clientNom: true,
            clientVille: true,
            montantTotal: true,
            ordreLivraison: true,
          },
          orderBy: { ordreLivraison: 'asc' },
        },
      },
    });
  }

  /** Ajoute des commandes à une tournée existante (même livreur). */
  async ajouterCommandes(runId: string, orderIds: string[]) {
    const run = await prisma.deliveryRun.findUnique({
      where: { id: runId },
      include: { courier: true, commandes: { select: { ordreLivraison: true } } },
    });
    if (!run) throw new Error('Tournée introuvable');
    if (!run.courierId || !run.courier) {
      throw new Error('Cette tournée n\'a pas encore de livreur.');
    }
    if (run.statut === 'TERMINEE' || run.statut === 'ANNULEE') {
      throw new Error('Cette tournée est clôturée.');
    }

    const orders = await validerCommandesPourTournee(orderIds);
    const maxOrdre = run.commandes.reduce((max, c) => Math.max(max, c.ordreLivraison ?? 0), 0);
    const assignedAt = run.assignedAt ?? new Date();

    for (let i = 0; i < orders.length; i++) {
      const order = orders[i]!;
      await deliveryNavigationService.geocoderCommande(order.id);
      await prisma.order.update({
        where: { id: order.id },
        data: {
          courierId: run.courierId,
          deliveryRunId: run.id,
          ordreLivraison: maxOrdre + i + 1,
          assignedAt,
        },
      });
      await trackingService.mettreAJourStatut(order.id, 'EXPEDIEE', {
        message: `Ajoutée à la tournée ${run.label ?? run.id} — livreur ${run.courier.nom}.`,
        notifier: true,
      });
    }

    if (run.statut === 'PLANIFIEE') {
      await prisma.deliveryRun.update({
        where: { id: run.id },
        data: { statut: 'EN_COURS' },
      });
    }

    await recalculerMontantsTournee(runId);

    return this.obtenirPourAdmin(runId);
  }

  /** Montants de tournée — réservé à l'admin (le livreur ne voit que le total cumulé). */
  async mettreAJourMontants(
    runId: string,
    data: { montantTotalGn?: number; montantEspecesGn?: number },
  ) {
    const run = await prisma.deliveryRun.findUnique({ where: { id: runId } });
    if (!run) throw new Error('Tournée introuvable');

    return prisma.deliveryRun.update({
      where: { id: runId },
      data: {
        ...(data.montantTotalGn !== undefined
          ? { montantTotalGn: Math.round(data.montantTotalGn) }
          : {}),
        ...(data.montantEspecesGn !== undefined
          ? { montantEspecesGn: Math.round(data.montantEspecesGn) }
          : {}),
      },
      include: {
        courier: { select: { id: true, nom: true, telephone: true } },
        commandes: {
          select: {
            id: true,
            clientNom: true,
            clientVille: true,
            montantTotal: true,
            statut: true,
            ordreLivraison: true,
          },
          orderBy: { ordreLivraison: 'asc' },
        },
      },
    });
  }

  async listerPourAdmin(activesOnly = true) {
    return prisma.deliveryRun.findMany({
      where: activesOnly ? { statut: { in: ['PLANIFIEE', 'EN_COURS'] } } : undefined,
      include: {
        courier: { select: { id: true, nom: true, telephone: true } },
        commandes: {
          select: {
            id: true,
            clientNom: true,
            clientVille: true,
            montantTotal: true,
            statut: true,
            ordreLivraison: true,
          },
          orderBy: { ordreLivraison: 'asc' },
        },
      },
      orderBy: { assignedAt: 'desc' },
    });
  }

  async obtenirPourAdmin(id: string) {
    return prisma.deliveryRun.findUnique({
      where: { id },
      include: {
        courier: { select: { id: true, nom: true, telephone: true } },
        commandes: {
          select: {
            id: true,
            clientNom: true,
            clientVille: true,
            montantTotal: true,
            statut: true,
            ordreLivraison: true,
          },
          orderBy: { ordreLivraison: 'asc' },
        },
      },
    });
  }

  /** Recalcule les totaux à partir des commandes (admin uniquement côté API). */
  async recalculerMontantsDepuisCommandes(runId: string) {
    await recalculerMontantsTournee(runId);
    return this.obtenirPourAdmin(runId);
  }

  /** Clôture la tournée si toutes les commandes sont livrées ou annulées. */
  async cloturerSiComplete(deliveryRunId: string | null | undefined) {
    if (!deliveryRunId) return;
    const restantes = await prisma.order.count({
      where: {
        deliveryRunId,
        statut: { notIn: ['LIVREE', 'ANNULEE'] },
      },
    });
    if (restantes === 0) {
      await prisma.deliveryRun.update({
        where: { id: deliveryRunId },
        data: { statut: 'TERMINEE' },
      });
    }
  }
}

export const deliveryRunService = new DeliveryRunService();
