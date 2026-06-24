export const BEAUTY_PROFILE_STORAGE_KEY = 'lovepiment-beauty-profile';
export const BEAUTY_PROFILE_UPDATED_EVENT = 'lovepiment:beauty-profile-updated';

export const TYPE_PEAU_OPTIONS = [
  { id: 'seche', label: 'Débutant·e', desc: 'Je découvre, je préfère le doux' },
  { id: 'normale', label: 'Curieux·se', desc: 'Ouvert·e aux nouveautés' },
  { id: 'mixte', label: 'Confirmé·e', desc: 'Je sais ce que j\'aime' },
  { id: 'grasse', label: 'Expert·e', desc: 'J\'ose tout, sans limites' },
] as const;

export const PREOCCUPATION_OPTIONS = [
  { id: 'hydratation', label: 'Confort & douceur' },
  { id: 'parfum', label: 'Stimulation intense' },
  { id: 'cheveux', label: 'Jeux de rôle' },
  { id: 'eclat', label: 'Surprise & découverte' },
  { id: 'souplesse', label: 'Couple & complicité' },
  { id: 'relaxation', label: 'Détente sensuelle' },
] as const;

export const UNIVERS_OPTIONS = [
  { id: 'sextoys', label: 'Sextoys' },
  { id: 'lingerie', label: 'Lingerie sexy' },
  { id: 'lubrifiants', label: 'Lubrifiants' },
  { id: 'accessoires', label: 'Accessoires érotiques' },
] as const;

export const PARFUM_OPTIONS = [
  { id: 'floral', label: 'Doux & romantique' },
  { id: 'boise', label: 'Audacieux & intense' },
  { id: 'fruite', label: 'Ludique & fun' },
  { id: 'oriental', label: 'Sensuel & mystérieux' },
  { id: 'frais', label: 'Discret & minimaliste' },
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
