import { NextRequest, NextResponse } from 'next/server';
import {
  formatAddressFromNominatim,
  type NominatimReverseResponse,
} from '@/shared/lib/geolocation/reverse-geocode';

function parseCoord(value: string | null, min: number, max: number): number | null {
  if (value == null) return null;
  const n = Number(value);
  if (!Number.isFinite(n) || n < min || n > max) return null;
  return n;
}

/** GET /api/geolocation/reverse?lat=&lon= — adresse lisible depuis des coordonnées GPS */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const lat = parseCoord(searchParams.get('lat'), -90, 90);
  const lon = parseCoord(searchParams.get('lon'), -180, 180);

  if (lat == null || lon == null) {
    return NextResponse.json({ message: 'Coordonnées invalides' }, { status: 400 });
  }

  const url = new URL('https://nominatim.openstreetmap.org/reverse');
  url.searchParams.set('lat', String(lat));
  url.searchParams.set('lon', String(lon));
  url.searchParams.set('format', 'json');
  url.searchParams.set('addressdetails', '1');
  url.searchParams.set('zoom', '18');
  url.searchParams.set('accept-language', 'fr');

  try {
    const res = await fetch(url.toString(), {
      headers: {
        'User-Agent': 'Love Piment&/1.0 (https://lovepiment.gn; contact@lovepiment.gn)',
      },
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      return NextResponse.json(
        { message: 'Géocodage indisponible' },
        { status: 502 },
      );
    }

    const data = (await res.json()) as NominatimReverseResponse;
    const suggestion = formatAddressFromNominatim(data, lat, lon);

    return NextResponse.json(suggestion);
  } catch (error) {
    console.error('[GET /api/geolocation/reverse]', error);
    return NextResponse.json({ message: 'Erreur de géolocalisation' }, { status: 500 });
  }
}
