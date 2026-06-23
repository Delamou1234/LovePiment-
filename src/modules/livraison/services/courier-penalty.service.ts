import { prisma } from '@/shared/lib/prisma';
import { trackingRepository } from '../repository/tracking.repository';

/** Pénalités livreur : espèces non déclarées à la livraison. */
export class CourierPenaltyService {
  /**
   * Si une commande espèces est livrée sans déclaration du livreur,
   * le montant est imputé au livreur (une seule fois par commande).
   */
  async verifierEtAppliquerPenalite(orderId: string) {
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order?.courierId) return null;

    const espècesNonDeclare =
      order.modePaiement === 'PAIEMENT_LIVRAISON' &&
      order.statutPaiement === 'EN_ATTENTE' &&
      order.livreurPaiementRecu == null &&
      order.penaliteLivreurGn == null;

    if (!espècesNonDeclare) return null;

    const montant = Number(order.montantTotal);
    if (!Number.isFinite(montant) || montant <= 0) return null;

    return this.appliquerPenalite(order.courierId, orderId, montant);
  }

  async appliquerPenalite(courierId: string, orderId: string, montantGn: number) {
    const montant = Math.round(montantGn);
    const courier = await prisma.courier.findUnique({ where: { id: courierId } });
    if (!courier) return null;

    await prisma.$transaction([
      prisma.order.update({
        where: { id: orderId },
        data: { penaliteLivreurGn: montant },
      }),
      prisma.courier.update({
        where: { id: courierId },
        data: { penalitesCumuleesGn: { increment: montant } },
      }),
    ]);

    const montantLabel = montant.toLocaleString('fr-FR');
    await trackingRepository.creerEvenement({
      orderId,
      type: 'NOTIFICATION',
      message: `Pénalité livreur ${courier.nom} : ${montantLabel} GN (paiement espèces non déclaré à la livraison).`,
      notifier: true,
    });

    return { courierId, orderId, montantGn: montant };
  }
}

export const courierPenaltyService = new CourierPenaltyService();
