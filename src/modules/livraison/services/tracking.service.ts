import { trackingRepository, type TrackingRepository } from '../repository/tracking.repository';
import { courierPenaltyService } from './courier-penalty.service';
import {
  buildNotificationContext,
  orderNotificationService,
} from '@/modules/notifications/services/order-notification.service';
import {
  DESCRIPTIONS_STATUT,
  estimerLivraison,
  formaterDate,
  LIBELLES_STATUT,
  statutAtteint,
  STATUTS_SUIVI,
} from '@/shared/lib/delivery-tracking';
import type { OrderStatus, OrderSatisfaction } from '@prisma/client';

export type SuiviCommandeDto = {
  id: string;
  suiviToken: string;
  statut: OrderStatus;
  statutLibelle: string;
  clientNom: string;
  clientVille: string;
  numeroSuivi: string | null;
  transporteur: { nom: string; telephone: string | null } | null;
  livraisonEstimee: string | null;
  livraisonLibelle: string;
  livreeLe: string | null;
  updatedAt: string;
  satisfaction: {
    statut: OrderSatisfaction;
    commentaire: string | null;
    date: string;
  } | null;
  timeline: {
    statut: OrderStatus;
    libelle: string;
    description: string;
    atteint: boolean;
    actif: boolean;
    date: string | null;
  }[];
  evenements: {
    id: string;
    type: string;
    message: string;
    statut: OrderStatus | null;
    date: string;
    notifier: boolean;
  }[];
  notifications: {
    id: string;
    message: string;
    date: string;
  }[];
};

export class TrackingService {
  constructor(private readonly repo: TrackingRepository = trackingRepository) {}

  async obtenirSuiviParToken(suiviToken: string): Promise<SuiviCommandeDto | null> {
    const order = await this.repo.trouverParToken(suiviToken);
    if (!order) return null;
    return this.toDto(order);
  }

  async obtenirSuiviParId(orderId: string): Promise<SuiviCommandeDto | null> {
    const order = await this.repo.trouverParId(orderId);
    if (!order) return null;
    return this.toDto(order);
  }

  async initialiserSuivi(orderId: string, clientVille: string) {
    return this.repo.initialiserSuiviCommande(orderId, clientVille);
  }

  async mettreAJourStatut(
    orderId: string,
    statut: OrderStatus,
    options?: {
      message?: string;
      carrierId?: string | null;
      numeroSuivi?: string | null;
      notifier?: boolean;
    },
  ) {
    const order = await this.repo.enregistrerChangementStatut(orderId, statut, options);

    if (statut === 'LIVREE') {
      await courierPenaltyService.verifierEtAppliquerPenalite(orderId);
    }

    if (options?.notifier !== false) {
      orderNotificationService.notifyStatusChange(
        buildNotificationContext(order, { statutMessage: options?.message }),
      );
    }

    return order;
  }

  async confirmerPaiementLivraison(orderId: string) {
    const order = await this.repo.confirmerPaiementLivraison(orderId);
    if (!order) return null;
    orderNotificationService.notifyPaymentConfirmed(buildNotificationContext(order));
    return order;
  }

  async listerTransporteurs() {
    return this.repo.listerTransporteurs();
  }

  async enregistrerSatisfaction(
    suiviToken: string,
    statut: OrderSatisfaction,
    commentaire?: string,
  ) {
    const order = await this.repo.enregistrerSatisfaction(suiviToken, statut, commentaire);
    return this.toDto(order);
  }

  async listerNotificationsSatisfaction(depuis: Date) {
    const events = await this.repo.listerEvenementsSatisfactionDepuis(depuis);
    return events.map((ev) => ({
      kind: 'satisfaction' as const,
      id: ev.id,
      message: ev.message,
      date: ev.createdAt.toISOString(),
      orderId: ev.order.id,
      clientNom: ev.order.clientNom,
      clientVille: ev.order.clientVille,
      satisfaction: ev.order.satisfactionStatut,
      commentaire: ev.order.satisfactionCommentaire,
      suiviToken: ev.order.suiviToken,
    }));
  }

  async listerDernieresSatisfactions(limit = 10) {
    const events = await this.repo.listerDernieresSatisfactions(limit);
    return events.map((ev) => ({
      kind: 'satisfaction' as const,
      id: ev.id,
      message: ev.message,
      date: ev.createdAt.toISOString(),
      orderId: ev.order.id,
      clientNom: ev.order.clientNom,
      clientVille: ev.order.clientVille,
      satisfaction: ev.order.satisfactionStatut,
      commentaire: ev.order.satisfactionCommentaire,
      suiviToken: ev.order.suiviToken,
    }));
  }

  async listerNotificationsLivreur(depuis: Date) {
    const events = await this.repo.listerEvenementsLivreurDepuis(depuis);
    return events.map((ev) => this.mapLivreurEvent(ev));
  }

  async listerDernieresNotificationsLivreur(limit = 15) {
    const events = await this.repo.listerDernieresNotificationsLivreur(limit);
    return events.map((ev) => this.mapLivreurEvent(ev));
  }

  async listerNotificationsAdmin(limit = 20) {
    const [satisfactions, livreur] = await Promise.all([
      this.listerDernieresSatisfactions(Math.ceil(limit / 2)),
      this.listerDernieresNotificationsLivreur(Math.ceil(limit / 2)),
    ]);

    return [...satisfactions, ...livreur]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit);
  }

  async listerNotificationsAdminDepuis(depuis: Date) {
    const [satisfactions, livreur] = await Promise.all([
      this.listerNotificationsSatisfaction(depuis),
      this.listerNotificationsLivreur(depuis),
    ]);

    const satisfactionItems = satisfactions.map((n) => ({
      kind: 'satisfaction' as const,
      ...n,
    }));

    return [...satisfactionItems, ...livreur].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  }

  private mapLivreurEvent(ev: {
    id: string;
    message: string;
    createdAt: Date;
    order: {
      id: string;
      clientNom: string;
      clientVille: string;
      courier: { id: string; nom: string } | null;
    };
  }) {
    return {
      kind: 'livreur' as const,
      id: ev.id,
      message: ev.message,
      date: ev.createdAt.toISOString(),
      orderId: ev.order.id,
      clientNom: ev.order.clientNom,
      clientVille: ev.order.clientVille,
      livreurNom: ev.order.courier?.nom ?? 'Livreur',
      livreurId: ev.order.courier?.id ?? null,
    };
  }

  private toDto(order: NonNullable<Awaited<ReturnType<TrackingRepository['trouverParToken']>>>): SuiviCommandeDto {
    const estimation = estimerLivraison({
      statut: order.statut,
      clientVille: order.clientVille,
      createdAt: order.createdAt,
      carrier: order.carrier,
      livraisonEstimee: order.livraisonEstimee,
      livreeLe: order.livreeLe,
    });

    const eventsByStatus = new Map<OrderStatus, Date>();
    for (const ev of order.trackingEvents) {
      if (ev.statut && !eventsByStatus.has(ev.statut)) {
        eventsByStatus.set(ev.statut, ev.createdAt);
      }
    }

    return {
      id: order.id,
      suiviToken: order.suiviToken,
      statut: order.statut,
      statutLibelle: LIBELLES_STATUT[order.statut],
      clientNom: order.clientNom,
      clientVille: order.clientVille,
      numeroSuivi: order.numeroSuivi,
      transporteur: order.carrier
        ? { nom: order.carrier.nom, telephone: order.carrier.telephone }
        : null,
      livraisonEstimee: order.livraisonEstimee?.toISOString() ?? estimation.dateMax.toISOString(),
      livraisonLibelle: estimation.libelle,
      livreeLe: order.livreeLe?.toISOString() ?? null,
      updatedAt: order.updatedAt.toISOString(),
      satisfaction: order.satisfactionStatut
        ? {
            statut: order.satisfactionStatut,
            commentaire: order.satisfactionCommentaire,
            date: order.satisfactionLe?.toISOString() ?? order.updatedAt.toISOString(),
          }
        : null,
      timeline: STATUTS_SUIVI.filter((s) => s !== 'ANNULEE').map((statut) => ({
        statut,
        libelle: LIBELLES_STATUT[statut],
        description: DESCRIPTIONS_STATUT[statut],
        atteint: statutAtteint(order.statut, statut),
        actif: order.statut === statut,
        date: eventsByStatus.get(statut) ? formaterDate(eventsByStatus.get(statut)!) : null,
      })),
      evenements: order.trackingEvents.map((ev) => ({
        id: ev.id,
        type: ev.type,
        message: ev.message,
        statut: ev.statut,
        date: ev.createdAt.toISOString(),
        notifier: ev.notifier,
      })),
      notifications: order.trackingEvents
        .filter((ev) => ev.type === 'NOTIFICATION' || ev.notifier)
        .slice(-10)
        .reverse()
        .map((ev) => ({
          id: ev.id,
          message: ev.message.replace(/^Notification client : /, ''),
          date: ev.createdAt.toISOString(),
        })),
    };
  }
}

export const trackingService = new TrackingService();
