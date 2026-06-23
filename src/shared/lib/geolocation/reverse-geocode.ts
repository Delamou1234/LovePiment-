export type GeolocationAddressSuggestion = {
  adresse: string;
  ville: string;
  label: string;
  latitude: number;
  longitude: number;
};

export type NominatimReverseResponse = {
  display_name?: string;
  address?: {
    house_number?: string;
    road?: string;
    neighbourhood?: string;
    suburb?: string;
    quarter?: string;
    hamlet?: string;
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    county?: string;
    state?: string;
    country?: string;
  };
};

export function formatAddressFromNominatim(
  data: NominatimReverseResponse,
  lat: number,
  lon: number,
): GeolocationAddressSuggestion {
  const addr = data.address ?? {};
  const rue = [addr.house_number, addr.road].filter(Boolean).join(' ');
  const quartier =
    addr.neighbourhood ?? addr.suburb ?? addr.quarter ?? addr.hamlet ?? null;
  const segments = [rue, quartier].filter((s) => s && s.length > 0) as string[];

  let adresse: string;
  if (segments.length > 0) {
    adresse = segments.join(', ');
  } else if (data.display_name) {
    adresse = data.display_name.split(',').slice(0, 3).join(',').trim();
  } else {
    adresse = `Position GPS (${lat.toFixed(5)}, ${lon.toFixed(5)})`;
  }

  const ville =
    addr.city ??
    addr.town ??
    addr.village ??
    addr.municipality ??
    addr.county ??
    addr.state ??
    'Conakry';

  return {
    adresse,
    ville,
    label: 'Ma position actuelle',
    latitude: lat,
    longitude: lon,
  };
}
