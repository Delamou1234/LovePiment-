import { customerAuthRepository } from '@/modules/auth/repository/customer-auth.repository';
import { marketingService } from '@/modules/marketing/services/marketing.service';
import type { CustomerOrderResume, CustomerProfile, MettreAJourProfilDto } from '@/modules/compte/types';

export class CustomerProfileService {
  async obtenirProfil(customerId: string): Promise<CustomerProfile | null> {
    const customer = await customerAuthRepository.trouverParId(customerId);
    if (!customer) return null;

    const [stats, derniereCommande, codeParrainage] = await Promise.all([
      customerAuthRepository.statsClient(customerId),
      customerAuthRepository.trouverDerniereCommande(customerId),
      marketingService.ensureReferralCode(customerId),
    ]);

    return {
      id: customer.id,
      email: customer.email,
      nom: customer.nom,
      telephone: customer.telephone,
      avatarUrl: customer.avatarUrl,
      avatarCouleur: customer.avatarCouleur ?? 'olive',
      adressePreferee:
        customer.adressePreferee ?? derniereCommande?.clientAdresse ?? null,
      villePreferee: customer.villePreferee ?? derniereCommande?.clientVille ?? null,
      viaGoogle: Boolean(customer.googleId),
      viaFacebook: Boolean(customer.facebookId),
      viaApple: Boolean(customer.appleId),
      peutChangerMotDePasse: Boolean(customer.passwordHash),
      inscritLe: customer.createdAt.toISOString(),
      stats,
      pointsFidelite: customer.pointsFidelite,
      codeParrainage,
    };
  }

  async mettreAJourProfil(customerId: string, dto: MettreAJourProfilDto) {
    const updated = await customerAuthRepository.mettreAJourProfil(customerId, dto);
    return this.obtenirProfil(updated.id);
  }

  async changerMotDePasse(customerId: string, ancien: string, nouveau: string) {
    return customerAuthRepository.changerMotDePasse(customerId, ancien, nouveau);
  }

  async listerCommandes(customerId: string): Promise<CustomerOrderResume[]> {
    const rows = await customerAuthRepository.listerCommandesClient(customerId);
    return rows.map((o) => ({
      id: o.id,
      statut: o.statut,
      montantTotal: Number(o.montantTotal),
      createdAt: o.createdAt.toISOString(),
      suiviToken: o.suiviToken,
      itemsCount: o._count.items,
    }));
  }
}

export const customerProfileService = new CustomerProfileService();
