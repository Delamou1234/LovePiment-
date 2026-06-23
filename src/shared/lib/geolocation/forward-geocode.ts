export type GeoCoordinates = {
  latitude: number;
  longitude: number;
};

export type NominatimSearchResult = {
  lat: string;
  lon: string;
  display_name?: string;
};

const NOMINATIM_HEADERS = {
  'User-Agent': 'KabiShop/1.0 (https://kabishop.vercel.app; contact@kabishop.com)',
};

/** Géocode une adresse texte (Conakry, Guinée). */
export async function geocodeAddress(
  adresse: string,
  ville: string,
): Promise<GeoCoordinates | null> {
  const query = `${adresse}, ${ville}, Guinée`.trim();
  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.searchParams.set('q', query);
  url.searchParams.set('format', 'json');
  url.searchParams.set('limit', '1');
  url.searchParams.set('countrycodes', 'gn');
  url.searchParams.set('accept-language', 'fr');

  try {
    const res = await fetch(url.toString(), {
      headers: NOMINATIM_HEADERS,
      next: { revalidate: 86400 },
    });
    if (!res.ok) return null;

    const results = (await res.json()) as NominatimSearchResult[];
    const hit = results[0];
    if (!hit) return null;

    const latitude = Number(hit.lat);
    const longitude = Number(hit.lon);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;

    return { latitude, longitude };
  } catch {
    return null;
  }
}
