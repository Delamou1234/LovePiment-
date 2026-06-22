import { LIVRAISON_CONFIG } from '@/shared/lib/shipping';

/** Infos boutique injectées dans le prompt de l'assistant (livraison, contact, paiement). */
export function formaterInfosBoutiquePourPrompt(): string {
  const whatsapp = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.trim() ?? '224625617377';

  return [
    'INFOS BOUTIQUE KABISHOP',
    '- Univers : parfums, huiles pour la peau, crèmes corporelles, cosmétiques',
    '- Ville : Conakry, Guinée',
    `- WhatsApp (conseiller / commande) : +${whatsapp}`,
    `- Livraison Conakry : ${LIVRAISON_CONFIG.tarifConakry.toLocaleString('fr-FR')} GN`,
    `- Livraison hors Conakry : ${LIVRAISON_CONFIG.tarifHorsConakry.toLocaleString('fr-FR')} GN`,
    `- Livraison gratuite Conakry à partir de ${LIVRAISON_CONFIG.seuilGratuit.toLocaleString('fr-FR')} GN de commande`,
    '- Paiement : Mobile Money (Orange, MTN), CinetPay, ou paiement à la livraison',
    '- Ne jamais inventer un produit, un prix ou un stock : utiliser uniquement le catalogue ci-dessous',
    '- Si rupture de stock : proposer une alternative du catalogue ou inviter à WhatsApp',
  ].join('\n');
}
