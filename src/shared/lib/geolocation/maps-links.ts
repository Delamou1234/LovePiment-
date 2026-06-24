import type { GeoCoordinates } from './forward-geocode';

/** Lien Google Maps — navigation vers la destination. */
export function googleMapsNavigationUrl(
  coords: GeoCoordinates,
  adresse: string,
  ville: string,
): string {
  void adresse;
  void ville;
  const url = new URL('https://www.google.com/maps/dir/');
  url.searchParams.set('api', '1');
  url.searchParams.set('destination', `${coords.latitude},${coords.longitude}`);
  url.searchParams.set('travelmode', 'driving');
  return url.toString();
}

/** Lien Waze. */
export function wazeNavigationUrl(coords: GeoCoordinates): string {
  const url = new URL('https://waze.com/ul');
  url.searchParams.set('ll', `${coords.latitude},${coords.longitude}`);
  url.searchParams.set('navigate', 'yes');
  return url.toString();
}

/** Carte OpenStreetMap intégrée (iframe). */
export function openStreetMapEmbedUrl(coords: GeoCoordinates, delta = 0.025): string {
  const { latitude: lat, longitude: lon } = coords;
  const bbox = `${lon - delta},${lat - delta},${lon + delta},${lat + delta}`;
  const url = new URL('https://www.openstreetmap.org/export/embed.html');
  url.searchParams.set('bbox', bbox);
  url.searchParams.set('layer', 'mapnik');
  url.searchParams.set('marker', `${lat},${lon}`);
  return url.toString();
}

/** Message WhatsApp pour le livreur. */
export function buildCourierWhatsAppMessage(params: {
  clientNom: string;
  clientTelephone: string;
  adresse: string;
  ville: string;
  navUrl: string;
  montantTotal?: number;
}): string {
  const lines = [
    '🚚 *Livraison Love Piment&*',
    '',
    `Client : ${params.clientNom}`,
    `Tél : ${params.clientTelephone}`,
    `Adresse : ${params.adresse}, ${params.ville}`,
  ];
  if (params.montantTotal != null) {
    lines.push(`Montant : ${params.montantTotal.toLocaleString('fr-FR')} GN`);
  }
  lines.push('', `🗺️ Itinéraire : ${params.navUrl}`);
  return lines.join('\n');
}
