import { storeSettingsService } from '@/modules/admin/services/store-settings.service';
import type { LivraisonConfig } from '@/shared/lib/shipping';
import { LIVRAISON_CONFIG_DEFAULT } from '@/shared/lib/shipping';

/** Infos boutique injectées dans le prompt de l'assistant (livraison, contact, paiement). */
export async function formaterInfosBoutiquePourPrompt(): Promise<string> {
  const whatsapp = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.trim() ?? '224625617377';
  let livraison: LivraisonConfig = LIVRAISON_CONFIG_DEFAULT;

  try {
    livraison = await storeSettingsService.getLivraisonConfig();
  } catch {
    /* défaut */
  }

  return [
    'INFOS BOUTIQUE LOVE PIMENT&',
    '- Univers : boutique intime adulte — sextoys, lingerie, lubrifiants, accessoires érotiques',
    '- Ville : Conakry, Guinée',
    `- WhatsApp (conseiller / commande) : +${whatsapp}`,
    `- Livraison ${livraison.villeParDefaut} : ${livraison.tarifConakry.toLocaleString('fr-FR')} GN`,
    `- Livraison hors ${livraison.villeParDefaut} : ${livraison.tarifHorsConakry.toLocaleString('fr-FR')} GN`,
    livraison.gratuiteActive
      ? `- Livraison gratuite ${livraison.villeParDefaut} à partir de ${livraison.seuilGratuit.toLocaleString('fr-FR')} GN de commande`
      : '- Pas de livraison gratuite configurée actuellement',
    livraison.delaiLabel ? `- Délai indicatif : ${livraison.delaiLabel}` : null,
    '- Paiement : Orange Money uniquement (compte marchand)',
    '- Ne jamais inventer un produit, un prix ou un stock : utiliser uniquement le catalogue ci-dessous',
    '- Si rupture de stock : proposer une alternative du catalogue ou inviter à WhatsApp',
  ]
    .filter(Boolean)
    .join('\n');
}
