/** Configuration livraison — valeurs par défaut si l’admin n’a pas encore renseigné. */
export type LivraisonConfig = {
  villeParDefaut: string;
  tarifConakry: number;
  tarifHorsConakry: number;
  seuilGratuit: number;
  gratuiteActive: boolean;
  delaiLabel: string | null;
  tarifsCommunes?: Record<string, number> | null;
};

export const LIVRAISON_CONFIG_DEFAULT: LivraisonConfig = {
  villeParDefaut: 'Conakry',
  tarifConakry: 15_000,
  tarifHorsConakry: 25_000,
  seuilGratuit: 500_000,
  gratuiteActive: true,
  delaiLabel: '24–48 h',
  tarifsCommunes: null,
};

/** @deprecated Utiliser LIVRAISON_CONFIG_DEFAULT ou useLivraisonConfig() */
export const LIVRAISON_CONFIG = LIVRAISON_CONFIG_DEFAULT;

let runtimeLivraisonConfig: LivraisonConfig | null = null;

export function setRuntimeLivraisonConfig(config: LivraisonConfig) {
  runtimeLivraisonConfig = config;
}

export function getEffectiveLivraisonConfig(override?: LivraisonConfig): LivraisonConfig {
  return override ?? runtimeLivraisonConfig ?? LIVRAISON_CONFIG_DEFAULT;
}

export function normaliserVilleLivraison(ville: string): string {
  return ville.trim().toLowerCase();
}

export function estVilleTarifLocal(ville: string, config: LivraisonConfig): boolean {
  return normaliserVilleLivraison(ville) === normaliserVilleLivraison(config.villeParDefaut);
}

export type CalculFraisLivraisonInput = {
  sousTotal: number;
  ville?: string;
  commune?: string | null;
  config?: LivraisonConfig;
};

export function calculerFraisLivraison(
  sousTotalOrInput: number | CalculFraisLivraisonInput,
  ville?: string,
  config?: LivraisonConfig,
): number {
  const input: CalculFraisLivraisonInput =
    typeof sousTotalOrInput === 'number'
      ? { sousTotal: sousTotalOrInput, ville, config }
      : sousTotalOrInput;

  const cfg = getEffectiveLivraisonConfig(input.config);
  const villeEffective = input.ville?.trim() || cfg.villeParDefaut;
  const villeNorm = normaliserVilleLivraison(villeEffective);
  const villeRef = normaliserVilleLivraison(cfg.villeParDefaut);
  const sousTotal = input.sousTotal;

  if (cfg.gratuiteActive && villeNorm === villeRef && sousTotal >= cfg.seuilGratuit) {
    return 0;
  }

  const commune = input.commune?.trim();
  if (commune && cfg.tarifsCommunes?.[commune] != null) {
    return cfg.tarifsCommunes[commune]!;
  }

  return villeNorm === villeRef ? cfg.tarifConakry : cfg.tarifHorsConakry;
}

export function calculerTotauxCommande(
  items: { prix: number; quantite: number }[],
  ville?: string,
  config?: LivraisonConfig,
  commune?: string | null,
) {
  const cfg = getEffectiveLivraisonConfig(config);
  const villeEffective = ville?.trim() || cfg.villeParDefaut;
  const sousTotal = items.reduce((acc, item) => acc + item.prix * item.quantite, 0);
  const fraisLivraison = calculerFraisLivraison({ sousTotal, ville: villeEffective, commune, config: cfg });
  const total = sousTotal + fraisLivraison;

  return { sousTotal, fraisLivraison, total, livraisonGratuite: fraisLivraison === 0 };
}

export function formaterPrixGN(montant: number): string {
  return `${montant.toLocaleString('fr-FR')} GN`;
}

export function libelleLivraisonOfferte(config?: LivraisonConfig): string {
  const cfg = getEffectiveLivraisonConfig(config);
  return `Livraison offerte dès ${formaterPrixGN(cfg.seuilGratuit)} à ${cfg.villeParDefaut}`;
}

export function libelleFraisLivraison(frais: number, commune?: string | null): string {
  if (frais === 0) return 'Offerte';
  const base = formaterPrixGN(frais);
  if (commune) return `${base} (${commune})`;
  return base;
}
