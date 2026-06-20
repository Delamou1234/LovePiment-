import type { MessagingProvider, EnvoyerMessageParams, GenererLienParams } from './messaging-provider.interface';

/**
 * WhatsAppProvider — génère des liens wa.me contextuels.
 * Utilise le numéro de la boutique depuis les variables d'environnement.
 */
export class WhatsAppProvider implements MessagingProvider {
  private readonly numeroBoutique: string;

  constructor() {
    this.numeroBoutique = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '224600000000';
  }

  genererLien({ message, numero }: GenererLienParams): string {
    const num = numero ?? this.numeroBoutique;
    // Nettoyer le numéro (supprimer +, espaces, tirets)
    const numNettoyé = num.replace(/[\s+\-()]/g, '');
    const messageEncode = encodeURIComponent(message);
    return `https://wa.me/${numNettoyé}?text=${messageEncode}`;
  }

  // Pas d'envoi serveur pour l'instant (WhatsApp Business API nécessite un compte vérifié)
  async envoyerMessage(_params: EnvoyerMessageParams): Promise<{ success: boolean; error?: string }> {
    return { success: false, error: 'WhatsApp Business API non configurée' };
  }
}

// ─── Helpers de génération de messages contextuels ────────────────────────────

export function genererMessageProduit(params: {
  nomProduit: string;
  taille?: string;
  couleur?: string;
  prix: number;
}): string {
  const { nomProduit, taille, couleur, prix } = params;
  let message = `Bonjour KabiShop 👋\n\nJe suis intéressé(e) par :\n📦 *${nomProduit}*`;
  if (taille) message += `\n📏 Taille : ${taille}`;
  if (couleur) message += `\n🎨 Couleur : ${couleur}`;
  message += `\n💰 Prix : ${prix.toLocaleString('fr-GN')} GNF\n\nEst-ce encore disponible ?`;
  return message;
}

export function genererMessageCommande(params: {
  numeroCommande: string;
  montant: number;
}): string {
  return `Bonjour KabiShop 👋\n\nJe voudrais suivre ma commande n°*${params.numeroCommande}* (${params.montant.toLocaleString('fr-GN')} GNF).\n\nMerci !`;
}

export function genererMessageGeneral(): string {
  return `Bonjour KabiShop 👋\n\nJ'ai une question concernant vos articles. Pouvez-vous m'aider ?`;
}
