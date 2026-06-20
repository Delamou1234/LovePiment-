// Interface PaymentProvider — principe SOLID O/L
// Toute implémentation (CinetPay, Stripe...) doit respecter ce contrat.

export interface InitierPaiementParams {
  transactionId: string;
  montant: number;
  description: string;
  clientNom: string;
  clientTelephone: string;
  returnUrl: string;
  notifyUrl: string;
}

export interface InitierPaiementResult {
  success: boolean;
  paymentUrl?: string;
  transactionId?: string;
  error?: string;
}

export interface VerifierStatutParams {
  transactionId: string;
}

export interface VerifierStatutResult {
  success: boolean;
  statut: 'EN_ATTENTE' | 'REUSSIE' | 'ECHOUEE' | 'REMBOURSEE';
  montant?: number;
  error?: string;
}

export interface PaymentProvider {
  /**
   * Initialise un paiement et retourne l'URL de paiement.
   */
  initierPaiement(params: InitierPaiementParams): Promise<InitierPaiementResult>;

  /**
   * Vérifie le statut d'une transaction après retour du prestataire.
   */
  verifierStatut(params: VerifierStatutParams): Promise<VerifierStatutResult>;

  /**
   * Valide la signature d'un webhook entrant.
   */
  validerWebhook(payload: unknown, signature: string): boolean;
}
