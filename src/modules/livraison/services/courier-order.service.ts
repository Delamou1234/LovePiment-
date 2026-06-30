import { prisma } from '@/shared/lib/prisma';
import { deliveryNavigationService } from './delivery-navigation.service';
import { deliveryRunService } from './delivery-run.service';
import { trackingRepository } from '../repository/tracking.repository';
import { trackingService } from './tracking.service';
import type { OrderStatus } from '@prisma/client';

export type CourierOrderDto = {
  id: string;
  statut: OrderStatus;
  clientNom: string;
  clientTelephone: string;
  clientAdresse: string;
  clientVille: string;
  montantTotal: number;
  modePaiement: string;
  statutPaiement: string;
  paiementEspecesEnAttente: boolean;
  deliveryRunId: string | null;
  ordreLivraison: number | null;
  assignedAt: string | null;
  createdAt: string;
  coordinates: { latitude: number; longitude: number } | null;
  itemsCount: number;
  livraisonNavToken: string;
  livreeLe?: string | null;
  livreurPaiementRecu?: boolean | null;
  priseEnCharge: boolean;
  priseEnChargeLe?: string | null;
  primeLivreurGn: number | null;
};

export type CourierOrderPublicDto = Omit<CourierOrderDto, 'montantTotal'>;

export type CourierLivraisonIsoleDto = {
  id: string;
  montantTotal: number;
  especesAEncaisser: number;
  commande: CourierOrderPublicDto;
};

export type CourierHistoriqueDto = CourierOrderPublicDto & {
  livreeLe: string | null;
  livreurPaiementRecu: boolean | null;
};

export type CourierTotauxDto = {
  livraisonsTerminees: number;
  montantTermineGn: number;
  especesEncaisseesGn: number;
  livraisonsEnCours: number;
  montantEnCoursGn: number;
  especesAEncaisserGn: number;
  primesTermineesGn: number;
  primesEnCoursGn: number;
};

export type CourierTourneeDto = {
  id: string;
  label: string;
  assignedAt: string | null;
  commandesCount: number;
  montantTotal: number;
  especesAEncaisser: number;
  primeTotal: number;
  commandes: CourierOrderPublicDto[];
};

function sansMontant(cmd: CourierOrderDto): CourierOrderPublicDto {
  const { montantTotal, ...rest } = cmd;
  void montantTotal;
  return rest;
}

function toCourierOrder(order: {
  id: string;
  statut: OrderStatus;
  clientNom: string;
  clientTelephone: string;
  clientAdresse: string;
  clientVille: string;
  montantTotal: unknown;
  modePaiement: string;
  statutPaiement: string;
  assignedAt: Date | null;
  createdAt: Date;
  clientLatitude: unknown;
  clientLongitude: unknown;
  livraisonNavToken: string;
  deliveryRunId?: string | null;
  ordreLivraison?: number | null;
  livreeLe?: Date | null;
  livreurPaiementRecu?: boolean | null;
  livreurPriseEnChargeAt?: Date | null;
  livreurPriseEnChargeAck?: boolean | null;
  primeLivreurGn?: unknown;
  items: unknown[];
}): Omit<CourierOrderDto, 'coordinates'> & {
  clientLatitude: unknown;
  clientLongitude: unknown;
} {
  return {
    id: order.id,
    statut: order.statut,
    clientNom: order.clientNom,
    clientTelephone: order.clientTelephone,
    clientAdresse: order.clientAdresse,
    clientVille: order.clientVille,
    montantTotal: Number(order.montantTotal),
    modePaiement: order.modePaiement,
    statutPaiement: order.statutPaiement,
    paiementEspecesEnAttente: false,
    deliveryRunId: order.deliveryRunId ?? null,
    ordreLivraison: order.ordreLivraison ?? null,
    assignedAt: order.assignedAt?.toISOString() ?? null,
    createdAt: order.createdAt.toISOString(),
    clientLatitude: order.clientLatitude,
    clientLongitude: order.clientLongitude,
    livraisonNavToken: order.livraisonNavToken,
    itemsCount: order.items.length,
    livreeLe: order.livreeLe?.toISOString() ?? null,
    livreurPaiementRecu: order.livreurPaiementRecu ?? null,
    priseEnCharge: Boolean(order.livreurPriseEnChargeAt && order.livreurPriseEnChargeAck),
    priseEnChargeLe: order.livreurPriseEnChargeAt?.toISOString() ?? null,
    primeLivreurGn:
      order.primeLivreurGn != null ? Number(order.primeLivreurGn) : null,
  };
}

async function withCoords(
  row: ReturnType<typeof toCourierOrder>,
  options?: { geocode?: boolean },
): Promise<CourierOrderDto> {
  let coordinates: CourierOrderDto['coordinates'] = null;
  if (row.clientLatitude != null && row.clientLongitude != null) {
    const lat = Number(row.clientLatitude);
    const lon = Number(row.clientLongitude);
    if (Number.isFinite(lat) && Number.isFinite(lon)) {
      coordinates = { latitude: lat, longitude: lon };
    }
  }
  if (!coordinates && options?.geocode !== false) {
    const geo = await deliveryNavigationService.geocoderCommande(row.id);
    if (geo) coordinates = geo;
  }
  const { clientLatitude, clientLongitude, ...rest } = row;
  void clientLatitude;
  void clientLongitude;
  return { ...rest, coordinates };
}

export class CourierOrderService {
  async listerPourLivreur(courierId: string): Promise<CourierOrderDto[]> {
    const orders = await prisma.order.findMany({
      where: {
        courierId,
        statut: { in: ['PAYEE', 'EN_PREPARATION', 'EXPEDIEE'] },
      },
      include: { items: true },
      orderBy: [
        { deliveryRunId: 'asc' },
        { ordreLivraison: 'asc' },
        { assignedAt: 'asc' },
        { createdAt: 'asc' },
      ],
    });

    return Promise.all(orders.map((o) => withCoords(toCourierOrder(o))));
  }

  async listerTourneesPourLivreur(courierId: string): Promise<{
    tournees: CourierTourneeDto[];
    livraisonsIsoles: CourierLivraisonIsoleDto[];
  }> {
    const commandes = await this.listerPourLivreur(courierId);
    const runs = await prisma.deliveryRun.findMany({
      where: {
        courierId,
        statut: { in: ['PLANIFIEE', 'EN_COURS'] },
      },
      orderBy: { assignedAt: 'asc' },
    });

    const byRun = new Map<string, CourierOrderDto[]>();
    const isoles: CourierOrderDto[] = [];

    for (const cmd of commandes) {
      if (cmd.deliveryRunId) {
        const list = byRun.get(cmd.deliveryRunId) ?? [];
        list.push(cmd);
        byRun.set(cmd.deliveryRunId, list);
      } else {
        isoles.push(cmd);
      }
    }

    const tournees: CourierTourneeDto[] = runs
      .map((run) => {
        const cmds = (byRun.get(run.id) ?? []).sort(
          (a, b) => (a.ordreLivraison ?? 0) - (b.ordreLivraison ?? 0),
        );
        if (cmds.length === 0) return null;
        const montantTotal =
          run.montantTotalGn != null
            ? Number(run.montantTotalGn)
            : cmds.reduce((s, c) => s + c.montantTotal, 0);
        const especesAEncaisser =
          run.montantEspecesGn != null
            ? Number(run.montantEspecesGn)
            : cmds
                .filter((c) => c.paiementEspecesEnAttente)
                .reduce((s, c) => s + c.montantTotal, 0);
        const primeTotal = cmds.reduce((s, c) => s + (c.primeLivreurGn ?? 0), 0);
        return {
          id: run.id,
          label: run.label ?? `Tournée #${run.id.slice(-6).toUpperCase()}`,
          assignedAt: run.assignedAt?.toISOString() ?? null,
          commandesCount: cmds.length,
          montantTotal,
          especesAEncaisser,
          primeTotal,
          commandes: cmds.map(sansMontant),
        };
      })
      .filter((t): t is CourierTourneeDto => t != null);

    const livraisonsIsoles: CourierLivraisonIsoleDto[] = isoles.map((cmd) => ({
      id: cmd.id,
      montantTotal: cmd.montantTotal,
      especesAEncaisser: cmd.paiementEspecesEnAttente ? cmd.montantTotal : 0,
      commande: sansMontant(cmd),
    }));

    return { tournees, livraisonsIsoles };
  }

  async listerHistoriquePourLivreur(
    courierId: string,
    pagination = { page: 1, limit: 50 },
  ): Promise<{ livraisons: CourierHistoriqueDto[]; total: number }> {
    const skip = (pagination.page - 1) * pagination.limit;
    const where = { courierId, statut: 'LIVREE' as const };

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: { items: true },
        orderBy: [{ livreeLe: 'desc' }, { updatedAt: 'desc' }],
        skip,
        take: pagination.limit,
      }),
      prisma.order.count({ where }),
    ]);

    const livraisons = await Promise.all(
      orders.map(async (o) => {
        const base = await withCoords(toCourierOrder(o), { geocode: false });
        const { montantTotal, ...rest } = base;
        void montantTotal;
        return {
          ...rest,
          livreeLe: base.livreeLe ?? null,
          livreurPaiementRecu: base.livreurPaiementRecu ?? null,
        };
      }),
    );

    return { livraisons, total };
  }

  async obtenirTotauxLivreur(courierId: string): Promise<CourierTotauxDto> {
    const [terminees, enCours, aggTermine, aggEnCours, aggPrimesTermine, aggPrimesEnCours] =
      await Promise.all([
      prisma.order.findMany({
        where: { courierId, statut: 'LIVREE' },
        select: {
          montantTotal: true,
          modePaiement: true,
          statutPaiement: true,
          livreurPaiementRecu: true,
        },
      }),
      prisma.order.findMany({
        where: {
          courierId,
          statut: { in: ['PAYEE', 'EN_PREPARATION', 'EXPEDIEE'] },
        },
        select: { montantTotal: true, modePaiement: true, statutPaiement: true },
      }),
      prisma.order.aggregate({
        where: { courierId, statut: 'LIVREE' },
        _sum: { montantTotal: true },
        _count: true,
      }),
      prisma.order.aggregate({
        where: {
          courierId,
          statut: { in: ['PAYEE', 'EN_PREPARATION', 'EXPEDIEE'] },
        },
        _sum: { montantTotal: true },
        _count: true,
      }),
      prisma.order.aggregate({
        where: { courierId, statut: 'LIVREE' },
        _sum: { primeLivreurGn: true },
      }),
      prisma.order.aggregate({
        where: {
          courierId,
          statut: { in: ['PAYEE', 'EN_PREPARATION', 'EXPEDIEE'] },
        },
        _sum: { primeLivreurGn: true },
      }),
    ]);

    const especesEncaisseesGn = 0;
    const especesAEncaisserGn = 0;

    return {
      livraisonsTerminees: aggTermine._count,
      montantTermineGn: Number(aggTermine._sum.montantTotal ?? 0),
      especesEncaisseesGn,
      livraisonsEnCours: aggEnCours._count,
      montantEnCoursGn: Number(aggEnCours._sum.montantTotal ?? 0),
      especesAEncaisserGn,
      primesTermineesGn: Number(aggPrimesTermine._sum.primeLivreurGn ?? 0),
      primesEnCoursGn: Number(aggPrimesEnCours._sum.primeLivreurGn ?? 0),
    };
  }

  async definirPrimeLivreur(orderId: string, primeLivreurGn: number | null) {
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new Error('Commande introuvable');
    if (!order.courierId) {
      throw new Error('Assignez d\'abord un livreur à cette commande.');
    }
    if (order.statut === 'LIVREE' || order.statut === 'ANNULEE') {
      throw new Error('Impossible de modifier la prime d\'une commande clôturée.');
    }
    if (primeLivreurGn != null && (primeLivreurGn < 0 || !Number.isFinite(primeLivreurGn))) {
      throw new Error('Montant de prime invalide.');
    }
    return prisma.order.update({
      where: { id: orderId },
      data: { primeLivreurGn },
    });
  }

  async obtenirPourLivreur(courierId: string, orderId: string) {
    const order = await prisma.order.findFirst({
      where: { id: orderId, courierId },
      include: {
        items: {
          include: {
            variante: {
              include: { produit: { select: { nom: true, images: true } } },
            },
          },
        },
      },
    });
    if (!order) return null;

    const base = await withCoords(toCourierOrder(order), { geocode: false });
    return {
      ...base,
      livreeLe: order.livreeLe?.toISOString() ?? null,
      livreurPaiementRecu: order.livreurPaiementRecu ?? null,
      items: order.items.map((item) => ({
        id: item.id,
        quantite: item.quantite,
        prixUnitaire: Number(item.prixUnitaire),
        nom: item.variante.produit.nom,
        image: item.variante.produit.images[0] ?? null,
      })),
    };
  }

  async assignerLivreur(
    orderId: string,
    courierId: string,
    options?: { primeLivreurGn?: number | null },
  ) {
    const primesParCommande =
      options?.primeLivreurGn != null && options.primeLivreurGn >= 0
        ? { [orderId]: options.primeLivreurGn }
        : undefined;
    await deliveryRunService.creerTournee({
      courierId,
      orderIds: [orderId],
      primesParCommande,
    });
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new Error('Assignation impossible');
    return order;
  }

  async marquerPriseEnCharge(courierId: string, orderId: string) {
    const order = await prisma.order.findFirst({
      where: { id: orderId, courierId },
      include: { courier: { select: { nom: true } } },
    });
    if (!order) return null;

    if (!order.courierId) {
      throw new Error('Aucun livreur assigné à cette commande.');
    }

    if (order.statut === 'LIVREE' || order.statut === 'ANNULEE') {
      throw new Error('Cette commande est déjà clôturée.');
    }

    if (order.livreurPriseEnChargeAt && order.livreurPriseEnChargeAck) {
      throw new Error('Vous avez déjà pris en charge ce colis.');
    }

    const now = new Date();
    await prisma.order.update({
      where: { id: orderId },
      data: {
        livreurPriseEnChargeAt: now,
        livreurPriseEnChargeAck: true,
      },
    });

    const livreurNom = order.courier?.nom ?? 'Le livreur';

    await trackingRepository.creerEvenement({
      orderId,
      type: 'LIVREUR',
      message: `${livreurNom} a pris en charge le colis de ${order.clientNom} (${order.clientVille}). Responsabilité livreur confirmée.`,
      notifier: false,
    });

    if (order.statut !== 'EXPEDIEE') {
      await trackingService.mettreAJourStatut(orderId, 'EXPEDIEE', {
        message: `${livreurNom} a récupéré votre colis — il est en route vers vous.`,
        notifier: true,
      });
    } else {
      await trackingRepository.creerEvenement({
        orderId,
        type: 'STATUT',
        statut: 'EXPEDIEE',
        message: `${livreurNom} confirme la prise en charge du colis.`,
        notifier: true,
      });
    }

    return prisma.order.findUnique({ where: { id: orderId } });
  }

  async marquerLivree(courierId: string, orderId: string) {
    const order = await prisma.order.findFirst({
      where: { id: orderId, courierId },
    });
    if (!order) return null;

    if (!order.courierId) {
      throw new Error('Aucun livreur assigné à cette commande.');
    }

    if (order.statut === 'LIVREE') {
      throw new Error('Cette commande est déjà marquée comme livrée.');
    }

    if (order.statut === 'ANNULEE') {
      throw new Error('Cette commande est annulée.');
    }

    const statutsLivrables = new Set<OrderStatus>(['PAYEE', 'EN_PREPARATION', 'EXPEDIEE']);
    if (!statutsLivrables.has(order.statut)) {
      throw new Error('Cette commande ne peut pas être livrée dans son état actuel.');
    }

    if (!order.livreurPriseEnChargeAt || !order.livreurPriseEnChargeAck) {
      throw new Error(
        'Vous devez d\'abord signaler la prise en charge du colis avant de le marquer comme livré.',
      );
    }

    const message = 'Colis remis au client.';

    await trackingService.mettreAJourStatut(orderId, 'LIVREE', {
      message,
      notifier: true,
    });

    await deliveryRunService.cloturerSiComplete(order.deliveryRunId);
    if (order.deliveryRunId) {
      await deliveryRunService.recalculerMontantsDepuisCommandes(order.deliveryRunId);
    }

    return prisma.order.findUnique({ where: { id: orderId } });
  }
}

export const courierOrderService = new CourierOrderService();
