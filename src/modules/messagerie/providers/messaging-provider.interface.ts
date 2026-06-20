// Interface MessagingProvider — contrat SOLID O/L/L
// Toute implémentation (WhatsApp, SMS...) doit respecter ce contrat.

export interface EnvoyerMessageParams {
  destinataire: string; // numéro de téléphone
  message: string;
}

export interface GenererLienParams {
  message: string;
  numero?: string; // si absent, utilise le numéro de la boutique
}

export interface MessagingProvider {
  /**
   * Génère un lien cliquable vers la messagerie avec un message pré-rempli.
   */
  genererLien(params: GenererLienParams): string;

  /**
   * Envoie un message (si l'API le permet côté serveur).
   * Pour WhatsApp Business API — optionnel dans un premier temps.
   */
  envoyerMessage?(params: EnvoyerMessageParams): Promise<{ success: boolean; error?: string }>;
}
