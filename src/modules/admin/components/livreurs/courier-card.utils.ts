export type CourierCardData = {
  id: string;
  nom: string;
  telephone: string;
  whatsapp: string | null;
  typeEngin: string;
  immatriculation: string | null;
  numeroCni: string | null;
  quartierBase: string | null;
  commune: string | null;
  permisConduire: string | null;
  photoUrl: string | null;
  verifie: boolean;
  actif: boolean;
};

export const COURIER_ENGIN_LABELS: Record<string, string> = {
  MOTO: 'Moto',
  VOITURE: 'Voiture',
  VELO: 'Vélo',
  AUTRE: 'Autre',
};

export function courierCardRef(id: string) {
  return `LP-${id.slice(-8).toUpperCase()}`;
}

export function courierInitials(nom: string) {
  return nom
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0] ?? '')
    .join('')
    .toUpperCase();
}

export function courierCardPrintUrl(ids?: string[]) {
  const params = new URLSearchParams();
  if (ids?.length === 1) {
    params.set('id', ids[0]!);
    params.set('single', '1');
  } else if (ids && ids.length > 0) {
    params.set('ids', ids.join(','));
  }
  params.set('print', '1');
  const query = params.toString();
  return `/admin/livreurs/carte${query ? `?${query}` : ''}`;
}

export function courierCardBatchPrintUrl(ids: string[]) {
  const params = new URLSearchParams();
  params.set('ids', ids.join(','));
  params.set('print', '1');
  return `/admin/livreurs/carte?${params.toString()}`;
}

export function courierCardVerifyUrl(id: string, baseUrl?: string) {
  const origin = (baseUrl ?? (typeof window !== 'undefined' ? window.location.origin : '')).replace(
    /\/$/,
    '',
  );
  const base =
    origin ||
    (process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000').replace(/\/$/, '');
  return `${base}/livreur/verifier/${id}`;
}
