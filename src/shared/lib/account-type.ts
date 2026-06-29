export type AccountType = 'client' | 'livreur' | 'client-livreur' | 'admin';

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  client: 'Client',
  livreur: 'Livreur',
  'client-livreur': 'Client & livreur',
  admin: 'Admin',
};

export function libelleTypeCompte(type: AccountType): string {
  return ACCOUNT_TYPE_LABELS[type];
}
