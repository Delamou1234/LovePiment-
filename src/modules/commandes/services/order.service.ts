import { orderRepository, type OrderRepository } from '../repository/order.repository';
import { validateAndResolveOrderItems } from '../lib/validate-order-items';
import { trackingService } from '@/modules/livraison/services/tracking.service';
import {
  buildNotificationContext,
  orderNotificationService,
} from '@/modules/notifications/services/order-notification.service';
import { notifierAdminNouvelleCommande } from '@/modules/livraison/services/admin-order-alert.service';
import { envoyerEmailConfirmationClient } from '@/modules/commandes/services/order-client-email.service';
import { customerAuthRepository } from '@/modules/auth/repository/customer-auth.repository';
import { revalidateBoutique } from '@/modules/produits/lib/revalidate-boutique';
import type { CommandeAvecItems, CreerCommandeDto, FiltresCommandes } from '../types';
import type { Pagination } from '@/types';

export class OrderService {
  constructor(private readonly repo: OrderRepository = orderRepository) {}

  async creerCommande(dto: CreerCommandeDto): Promise<CommandeAvecItems> {
    const itemsResolus = await validateAndResolveOrderItems(dto.items);
    const dtoSecurise = { ...dto, items: itemsResolus };

    const commande = await this.repo.creer(dtoSecurise);
    await trackingService.initialiserSuivi(commande.id, dto.clientVille);
    orderNotificationService.notifyOrderCreated(buildNotificationContext(commande));
    void notifierAdminNouvelleCommande(commande);
    const customerRow = dto.customerId
      ? await customerAuthRepository.trouverParId(dto.customerId)
      : null;
    void envoyerEmailConfirmationClient({
      ...commande,
      customer: customerRow,
    });

    const slugs = [
      ...new Set(
        commande.items
          .map((item) => item.variante?.produit?.slug)
          .filter((slug): slug is string => Boolean(slug)),
      ),
    ];
    revalidateBoutique();
    for (const slug of slugs) {
      revalidateBoutique({ productSlug: slug });
    }

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

  async confirmerPaiement(id: string, paymentOrderId: string): Promise<void> {
    await this.repo.mettreAJourPaiement(id, {
      statutPaiement: 'REUSSIE',
      paymentOrderId,
    });
    await trackingService.mettreAJourStatut(id, 'PAYEE', {
      message: 'Paiement Orange Money confirmé.',
    });
  }

  async enregistrerSessionPaiement(
    id: string,
    data: {
      paymentOrderId: string;
      paymentPayToken: string;
      paymentNotifToken: string;
      paymentTelephone?: string;
    },
  ): Promise<void> {
    await this.repo.mettreAJourPaiement(id, {
      statutPaiement: 'EN_ATTENTE',
      paymentOrderId: data.paymentOrderId,
      paymentPayToken: data.paymentPayToken,
      paymentNotifToken: data.paymentNotifToken,
    });
    if (data.paymentTelephone) {
      await this.repo.mettreAJourTelephonePaiement(id, data.paymentTelephone);
    }
  }

  async definirTelephonePaiement(id: string, paymentTelephone: string): Promise<void> {
    await this.repo.mettreAJourTelephonePaiement(id, paymentTelephone);
  }

  /** Marque le paiement échoué sans annuler la commande (le client peut réessayer). */
  async marquerPaiementEchoue(id: string): Promise<void> {
    const commande = await this.repo.trouverParId(id);
    if (!commande || commande.statutPaiement === 'REUSSIE') return;
    await this.repo.mettreAJourPaiement(id, { statutPaiement: 'ECHOUEE' });
  }

  async echecPaiement(id: string): Promise<void> {
    await this.repo.annulerEtRestaurerStock(id, { statutPaiement: 'ECHOUEE' });
    revalidateBoutique();
  }

  /** Annule une commande et remet le stock (ex. échec Orange Money à l'initiation). */
  async annulerApresEchecPaiement(id: string): Promise<void> {
    await this.repo.annulerEtRestaurerStock(id, { statutPaiement: 'ECHOUEE' });
    revalidateBoutique();
  }

  calculerTotal(items: { prixUnitaire: number; quantite: number }[]): number {
    return items.reduce((acc, item) => acc + item.prixUnitaire * item.quantite, 0);
  }
}

export const orderService = new OrderService();
