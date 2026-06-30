import { adminAuthRepository } from '@/modules/auth/repository/admin-auth.repository';
import { customerAuthRepository } from '@/modules/auth/repository/customer-auth.repository';
import { resoudreContexteLivreurClient } from '@/modules/livraison/services/courier-customer.service';
import { libelleTypeCompte, type AccountType } from '@/shared/lib/account-type';
import type { AuthSessionUser } from '@/shared/lib/auth/auth-session-user';

export type AuthMeApiUser = AuthSessionUser & {
  viaGoogle?: boolean;
  adressePreferee?: string | null;
  villePreferee?: string | null;
};

/** Profil client complet pour session / préremplissage formulaires. */
export async function construireUtilisateurClientAuth(
  customerId: string,
): Promise<AuthMeApiUser | null> {
  const customer = await customerAuthRepository.trouverParId(customerId);
  if (!customer) return null;

  const derniereCommande = await customerAuthRepository.trouverDerniereCommande(customer.id);
  const livreur = await resoudreContexteLivreurClient(customer.id);
  const accountType: AccountType = livreur ? 'client-livreur' : 'client';

  return {
    id: customer.id,
    email: customer.email,
    name: customer.nom,
    role: 'customer',
    accountType,
    accountTypeLabel: libelleTypeCompte(accountType),
    telephone: customer.telephone,
    avatarUrl: customer.avatarUrl,
    viaGoogle: Boolean(customer.googleId),
    adressePreferee: customer.adressePreferee,
    villePreferee: customer.villePreferee,
    derniereAdresse:
      customer.adressePreferee ?? derniereCommande?.clientAdresse ?? null,
    derniereVille: customer.villePreferee ?? derniereCommande?.clientVille ?? null,
  };
}

export async function construireUtilisateurAdminAuth(
  adminId: string,
  fallbackEmail: string,
): Promise<AuthMeApiUser | null> {
  const admin =
    (await adminAuthRepository.trouverParId(adminId)) ??
    (await adminAuthRepository.trouverParEmail(fallbackEmail));
  if (!admin?.actif) return null;

  return {
    id: admin.id,
    email: admin.email,
    name: admin.nom,
    role: 'admin',
    accountType: 'admin',
    accountTypeLabel: libelleTypeCompte('admin'),
  };
}

export function construireUtilisateurLivreurAuth(data: {
  id: string;
  email: string;
  name: string;
}): AuthMeApiUser {
  return {
    id: data.id,
    email: data.email,
    name: data.name,
    role: 'courier',
    accountType: 'livreur',
    accountTypeLabel: libelleTypeCompte('livreur'),
  };
}
