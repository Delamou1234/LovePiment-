export const BEAUTY_PROFILE_STORAGE_KEY = 'kabishop-beauty-profile';
export const BEAUTY_PROFILE_UPDATED_EVENT = 'kabishop:beauty-profile-updated';

export const TYPE_PEAU_OPTIONS = [
  { id: 'seche', label: 'Sèche', desc: 'Tiraillements, manque de confort' },
  { id: 'normale', label: 'Normale', desc: 'Équilibrée, peu de soucis' },
  { id: 'mixte', label: 'Mixte', desc: 'Zone T un peu grasse, joues normales' },
  { id: 'grasse', label: 'Grasse', desc: 'Brillance, pores visibles' },
] as const;

export const PREOCCUPATION_OPTIONS = [
  { id: 'hydratation', label: 'Hydratation' },
  { id: 'parfum', label: 'Parfum durable' },
  { id: 'cheveux', label: 'Soin des cheveux' },
  { id: 'eclat', label: 'Éclat du teint' },
  { id: 'souplesse', label: 'Souplesse de la peau' },
  { id: 'relaxation', label: 'Moment détente' },
] as const;

export const UNIVERS_OPTIONS = [
  { id: 'parfums', label: 'Parfums' },
  { id: 'huiles-corps', label: 'Huiles corps' },
  { id: 'huiles-cheveux', label: 'Huiles cheveux' },
  { id: 'cremes', label: 'Crèmes corporelles' },
] as const;

export const PARFUM_OPTIONS = [
  { id: 'floral', label: 'Floral' },
  { id: 'boise', label: 'Boisé' },
  { id: 'fruite', label: 'Fruité' },
  { id: 'oriental', label: 'Oriental' },
  { id: 'frais', label: 'Frais & léger' },
] as const;

export const BUDGET_OPTIONS = [
  { id: 'accessible', label: 'Accessible', desc: 'Bon rapport qualité-prix' },
  { id: 'confort', label: 'Confort', desc: 'Milieu de gamme' },
  { id: 'premium', label: 'Premium', desc: 'Sans compromis' },
] as const;

export type TypePeau = (typeof TYPE_PEAU_OPTIONS)[number]['id'];
export type Preoccupation = (typeof PREOCCUPATION_OPTIONS)[number]['id'];
export type UniversBeaute = (typeof UNIVERS_OPTIONS)[number]['id'];
export type FamilleParfum = (typeof PARFUM_OPTIONS)[number]['id'];
export type BudgetBeaute = (typeof BUDGET_OPTIONS)[number]['id'];

export type BeautyProfile = {
  typePeau: TypePeau;
  preoccupations: Preoccupation[];
  univers: UniversBeaute[];
  familleParfum: FamilleParfum | null;
  budget: BudgetBeaute;
  completedAt: string;
};

export type BeautyProfileDraft = Partial<
  Omit<BeautyProfile, 'completedAt' | 'preoccupations' | 'univers'>
> & {
  preoccupations?: Preoccupation[];
  univers?: UniversBeaute[];
};

export function isBeautyProfileComplete(draft: BeautyProfileDraft): draft is BeautyProfile {
  return Boolean(
    draft.typePeau &&
      draft.preoccupations &&
      draft.preoccupations.length > 0 &&
      draft.univers &&
      draft.univers.length > 0 &&
      draft.budget,
  );
}

export function lireProfilBeauteLocal(): BeautyProfile | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(BEAUTY_PROFILE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as BeautyProfile;
    return isBeautyProfileComplete(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function enregistrerProfilBeauteLocal(profile: BeautyProfile) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(BEAUTY_PROFILE_STORAGE_KEY, JSON.stringify(profile));
  window.dispatchEvent(new CustomEvent(BEAUTY_PROFILE_UPDATED_EVENT, { detail: profile }));
}

export function effacerProfilBeauteLocal() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(BEAUTY_PROFILE_STORAGE_KEY);
  window.dispatchEvent(new CustomEvent(BEAUTY_PROFILE_UPDATED_EVENT, { detail: null }));
}

export function encoderProfilBeautePourApi(profile: BeautyProfile | null): string | undefined {
  if (!profile) return undefined;
  return encodeURIComponent(JSON.stringify(profile));
}

export function decoderProfilBeauteDepuisApi(encoded: string | undefined): BeautyProfile | null {
  if (!encoded) return null;
  try {
    const parsed = JSON.parse(decodeURIComponent(encoded)) as BeautyProfile;
    return isBeautyProfileComplete(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function labelFrom<T extends { id: string; label: string }>(options: readonly T[], id: string) {
  return options.find((o) => o.id === id)?.label ?? id;
}

export function formaterProfilBeautePourIa(profile: BeautyProfile): string {
  const preoccupations = profile.preoccupations
    .map((id) => labelFrom(PREOCCUPATION_OPTIONS, id))
    .join(', ');
  const univers = profile.univers.map((id) => labelFrom(UNIVERS_OPTIONS, id)).join(', ');
  const parfum = profile.familleParfum
    ? labelFrom(PARFUM_OPTIONS, profile.familleParfum)
    : 'non précisé';

  return [
    `Type de peau: ${labelFrom(TYPE_PEAU_OPTIONS, profile.typePeau)}`,
    `Préoccupations: ${preoccupations}`,
    `Univers préférés: ${univers}`,
    `Famille de parfum: ${parfum}`,
    `Budget: ${labelFrom(BUDGET_OPTIONS, profile.budget)}`,
  ].join('\n');
}

export function resumeProfilBeaute(profile: BeautyProfile) {
  return {
    typePeau: labelFrom(TYPE_PEAU_OPTIONS, profile.typePeau),
    preoccupations: profile.preoccupations.map((id) => labelFrom(PREOCCUPATION_OPTIONS, id)),
    univers: profile.univers.map((id) => labelFrom(UNIVERS_OPTIONS, id)),
    familleParfum: profile.familleParfum
      ? labelFrom(PARFUM_OPTIONS, profile.familleParfum)
      : null,
    budget: labelFrom(BUDGET_OPTIONS, profile.budget),
  };
}
