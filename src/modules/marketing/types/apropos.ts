import { z } from 'zod';

export const APROPOS_ICON_KEYS = [
  'badge-check',
  'truck',
  'shield-check',
  'heart',
  'sparkles',
  'users',
  'gem',
  'headset',
] as const;

export type AproposIconKey = (typeof APROPOS_ICON_KEYS)[number];

export type AproposChiffre = {
  value: string;
  label: string;
};

export type AproposValeur = {
  title: string;
  text: string;
  icon: AproposIconKey;
};

export type AproposPublicConfig = {
  heroKicker: string;
  heroTitre: string;
  heroAccent: string;
  heroTexte: string;
  heroImageUrl: string;
  missionTitre: string;
  missionTexte: string;
  histoireTitre: string;
  histoireTexte: string;
  chiffres: AproposChiffre[];
  valeurs: AproposValeur[];
  ctaTitre: string;
  ctaTexte: string;
  metaDescription: string;
};

export const DEFAULT_APROPOS_CHIFFRES: AproposChiffre[] = [];

export const DEFAULT_APROPOS_VALEURS: AproposValeur[] = [
  {
    icon: 'badge-check',
    title: 'Produits authentiques',
    text: 'Sélection rigoureuse, matériaux body-safe et emballage neutre garanti.',
  },
  {
    icon: 'truck',
    title: 'Livraison discrète',
    text: 'Colis sans logo visible, livré rapidement à Conakry et environs.',
  },
  {
    icon: 'shield-check',
    title: 'Paiement sécurisé',
    text: 'Orange Money (compte marchand).',
  },
  {
    icon: 'heart',
    title: 'Service humain',
    text: 'WhatsApp, messagerie instantanée et équipe bienveillante 7j/7.',
  },
];

export const DEFAULT_APROPOS: AproposPublicConfig = {
  heroKicker: 'Notre histoire',
  heroTitre: 'Le plaisir sans tabou,',
  heroAccent: 'livrée à Conakry',
  heroTexte:
    'Love Piment& est votre boutique intime à Conakry : sextoys, lingerie, lubrifiants et accessoires pour adultes. Nous offrons une expérience discrète, confidentielle et chaleureuse à chaque cliente.',
  heroImageUrl: '/images/hero-love-piment-visual.png',
  missionTitre: 'Notre mission',
  missionTexte:
    "Rendre le bien-être intime accessible à toutes les femmes de Conakry : catalogue clair, conseils personnalisés, suivi de commande en temps réel et options de paiement adaptées au marché local — le tout dans le plus strict respect de votre vie privée.",
  histoireTitre: 'Qui sommes-nous ?',
  histoireTexte:
    "Love Piment& est née d'un constat simple : en Guinée, il manquait une boutique en ligne dédiée au plaisir féminin, à la fois professionnelle et sans jugement.\n\nNous avons créé un espace où chaque femme peut explorer sa sensualité en toute confiance : commande discrète, livraison soignée et accompagnement humain à chaque étape.",
  chiffres: DEFAULT_APROPOS_CHIFFRES,
  valeurs: DEFAULT_APROPOS_VALEURS,
  ctaTitre: 'Prêt à commander ?',
  ctaTexte:
    'Parcourez notre boutique intime ou profitez de nos promotions en cours. Notre équipe reste disponible pour vous guider, en toute discrétion.',
  metaDescription:
    'Love Piment& — boutique intime pour femmes à Conakry. Sextoys, lingerie, lubrifiants. Livraison discrète, paiement Mobile Money.',
};

const chiffreSchema = z.object({
  value: z.string().min(1).max(40),
  label: z.string().min(1).max(120),
});

const valeurSchema = z.object({
  title: z.string().min(1).max(120),
  text: z.string().min(1).max(500),
  icon: z.enum(APROPOS_ICON_KEYS),
});

export const aproposPatchSchema = z.object({
  heroKicker: z.string().min(1).max(80).optional(),
  heroTitre: z.string().min(1).max(200).optional(),
  heroAccent: z.string().min(1).max(120).optional(),
  heroTexte: z.string().min(10).max(4000).optional(),
  heroImageUrl: z.string().min(1).max(500).optional(),
  missionTitre: z.string().min(1).max(120).optional(),
  missionTexte: z.string().min(10).max(4000).optional(),
  histoireTitre: z.string().min(1).max(120).optional(),
  histoireTexte: z.string().min(10).max(6000).optional(),
  chiffres: z.array(chiffreSchema).min(1).max(8).optional(),
  valeurs: z.array(valeurSchema).min(1).max(8).optional(),
  ctaTitre: z.string().min(1).max(120).optional(),
  ctaTexte: z.string().min(10).max(2000).optional(),
  metaDescription: z.string().min(10).max(500).optional(),
});

export type AproposPatchDto = z.infer<typeof aproposPatchSchema>;

export function parseAproposChiffres(raw: unknown): AproposChiffre[] {
  const parsed = z.array(chiffreSchema).safeParse(raw);
  return parsed.success && parsed.data.length > 0 ? parsed.data : [];
}

export function parseAproposValeurs(raw: unknown): AproposValeur[] {
  const parsed = z.array(valeurSchema).safeParse(raw);
  return parsed.success && parsed.data.length > 0 ? parsed.data : DEFAULT_APROPOS_VALEURS;
}
