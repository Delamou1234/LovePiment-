export type ContactSubjectKey = 'GENERAL' | 'COMMANDE' | 'PRODUIT' | 'PARTENARIAT' | 'AUTRE';

export type ContactStatusKey = 'NOUVEAU' | 'LU' | 'TRAITE';

export type CreerContactDto = {
  nom: string;
  email: string;
  telephone?: string;
  sujet: ContactSubjectKey;
  message: string;
  customerId?: string;
};

export type ContactMessageResume = {
  id: string;
  nom: string;
  email: string;
  telephone: string | null;
  sujet: ContactSubjectKey;
  sujetLabel: string;
  message: string;
  statut: ContactStatusKey;
  createdAt: string;
  traiteLe: string | null;
};

export const CONTACT_SUJETS: { value: ContactSubjectKey; label: string }[] = [
  { value: 'GENERAL', label: 'Question générale' },
  { value: 'COMMANDE', label: 'Commande / livraison' },
  { value: 'PRODUIT', label: 'Question sur un produit' },
  { value: 'PARTENARIAT', label: 'Partenariat / wholesale' },
  { value: 'AUTRE', label: 'Autre' },
];

export function labelSujet(sujet: ContactSubjectKey): string {
  return CONTACT_SUJETS.find((s) => s.value === sujet)?.label ?? sujet;
}
