import { orderRepository, type OrderRepository } from '../repository/order.repository';
import { trackingService } from '@/modules/livraison/services/tracking.service';
import {
  buildNotificationContext,
  orderNotificationService,
} from '@/modules/notifications/services/order-notification.service';
import type { CommandeAvecItems, CreerCommandeDto, FiltresCommandes } from '../types';
import type { Pagination } from '@/types';

export class OrderService {
  constructor(private readonly repo: OrderRepository = orderRepository) {}

  async creerCommande(dto: CreerCommandeDto): Promise<CommandeAvecItems> {
    // Validation métier : au moins un article
    if (!dto.items || dto.items.length === 0) {
      throw new Error('La commande doit contenir au moins un article');
    }

    // Validation : tous les prix doivent être positifs
    for (const item of dto.items) {
      if (item.prixUnitaire <= 0) {
        throw new Error(`Prix invalide pour la variante ${item.variantId}`);
      }
      if (item.quantite <= 0) {
        throw new Error(`Quantité invalide pour la variante ${item.variantId}`);
      }
    }

    const commande = await this.repo.creer(dto);
    await trackingService.initialiserSuivi(commande.id, dto.clientVille);
    orderNotificationService.notifyOrderCreated(buildNotificationContext(commande));
    return commande;
  }

  async obtenirCommande(id: string): Promise<CommandeAvecItems> {
    const commande = await this.repo.trouverParId(id);
    if (!commande) {
      throw new Error(`Commande introuvable : ${id}`);
    }
    return commande;
  }

  async listerCommandes(
    filtres?: FiltresCommandes,
    pagination?: { page: number; limit: number },
  ): Promise<{ commandes: CommandeAvecItems[]; pagination: Pagination }> {
    return this.repo.lister(filtres, pagination);
  }

  async changerStatut(id: string, statut: string): Promise<void> {
    const commande = await this.repo.trouverParId(id);
    if (!commande) {
      throw new Error(`Commande introuvable : ${id}`);
    }
    return this.repo.mettreAJourStatut(id, statut);
  }

  async confirmerPaiement(id: string, cinetpayTxId: string): Promise<void> {
    await this.repo.mettreAJourPaiement(id, {
      statutPaiement: 'REUSSIE',
      cinetpayTxId,
    });
    await trackingService.mettreAJourStatut(id, 'PAYEE', {
      message: 'Paiement en ligne confirmé.',
    });
  }

  async enregistrerTransactionCinetPay(id: string, cinetpayTxId: string): Promise<void> {
    await this.repo.mettreAJourPaiement(id, {
      statutPaiement: 'EN_ATTENTE',
      cinetpayTxId,
    });
  }

  async echecPaiement(id: string): Promise<void> {
    return this.repo.mettreAJourPaiement(id, {
      statutPaiement: 'ECHOUEE',
    });
  }

  calculerTotal(items: { prixUnitaire: number; quantite: number }[]): number {
    return items.reduce((acc, item) => acc + item.prixUnitaire * item.quantite, 0);
  }
}

export const orderService = new OrderService();
