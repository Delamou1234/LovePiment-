import { prisma } from '@/shared/lib/prisma';
import { deliveryNavigationService } from './delivery-navigation.service';
import { distanceKm, formaterDistance } from '@/shared/lib/geolocation/distance';
import type { GeoCoordinates } from '@/shared/lib/geolocation/forward-geocode';

import { COMMUNES_CONAKRY_REFERENCE } from '@/shared/lib/communes-conakry';

const COMMUNES_CONAKRY = [...COMMUNES_CONAKRY_REFERENCE];

export type GeoOrderPoint = {
  id: string;
  clientNom: string;
  clientVille: string;
  clientAdresse: string;
  montantTotal: number;
  coordinates: GeoCoordinates | null;
  commune: string;
};

export type GeoOrderGroup = {
  id: string;
  label: string;
  methode: 'gps' | 'commune';
  commune: string;
  orderIds: string[];
  commandes: {
    id: string;
    clientNom: string;
    clientVille: string;
    clientAdresse: string;
    montantTotal: number;
  }[];
  commandesCount: number;
  montantTotal: number;
  centroid: GeoCoordinates | null;
  etendueKm: number | null;
  ordreSuggere: string[];
};

export function normaliserCommune(ville: string): string {
  const v = ville.trim().toLowerCase();
  for (const c of COMMUNES_CONAKRY) {
    if (v.includes(c.toLowerCase())) return c;
  }
  const trimmed = ville.trim();
  return trimmed.length > 0 ? trimmed : 'Autre';
}

function parseCoords(lat: unknown, lon: unknown): GeoCoordinates | null {
  if (lat == null || lon == null) return null;
  const latitude = Number(lat);
  const longitude = Number(lon);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  return { latitude, longitude };
}

function centroid(coords: GeoCoordinates[]): GeoCoordinates {
  return {
    latitude: coords.reduce((s, c) => s + c.latitude, 0) / coords.length,
    longitude: coords.reduce((s, c) => s + c.longitude, 0) / coords.length,
  };
}

function clusterSpanKm(points: GeoOrderPoint[]): number {
  const withCoords = points.filter((p) => p.coordinates);
  if (withCoords.length < 2) return 0;
  let max = 0;
  for (let i = 0; i < withCoords.length; i++) {
    for (let j = i + 1; j < withCoords.length; j++) {
      max = Math.max(
        max,
        distanceKm(withCoords[i]!.coordinates!, withCoords[j]!.coordinates!),
      );
    }
  }
  return max;
}

/** Ordre de livraison suggéré (plus proche voisin). */
function ordreLivraisonOptimal(points: GeoOrderPoint[]): string[] {
  const withCoords = points.filter((p) => p.coordinates);
  if (withCoords.length === 0) return points.map((p) => p.id);
  if (withCoords.length === 1) return [withCoords[0]!.id, ...points.filter((p) => !p.coordinates).map((p) => p.id)];

  const sorted: GeoOrderPoint[] = [withCoords[0]!];
  const rest = withCoords.slice(1);
  while (rest.length > 0) {
    const last = sorted[sorted.length - 1]!;
    let bestIdx = 0;
    let bestD = Infinity;
    for (let i = 0; i < rest.length; i++) {
      const d = distanceKm(last.coordinates!, rest[i]!.coordinates!);
      if (d < bestD) {
        bestD = d;
        bestIdx = i;
      }
    }
    sorted.push(rest.splice(bestIdx, 1)[0]!);
  }
  const sansGps = points.filter((p) => !p.coordinates).map((p) => p.id);
  return [...sorted.map((p) => p.id), ...sansGps];
}

function clusterByDistance(points: GeoOrderPoint[], radiusKm: number): GeoOrderPoint[][] {
  const withCoords = points.filter((p) => p.coordinates);
  const remaining = [...withCoords];
  const clusters: GeoOrderPoint[][] = [];

  while (remaining.length > 0) {
    const seed = remaining.shift()!;
    const cluster = [seed];
    for (let i = remaining.length - 1; i >= 0; i--) {
      const candidate = remaining[i]!;
      const proche = cluster.some(
        (m) => distanceKm(m.coordinates!, candidate.coordinates!) <= radiusKm,
      );
      if (proche) {
        cluster.push(candidate);
        remaining.splice(i, 1);
      }
    }
    clusters.push(cluster);
  }

  return clusters;
}

function toGroup(
  points: GeoOrderPoint[],
  methode: 'gps' | 'commune',
  index: number,
): GeoOrderGroup {
  const coords = points.map((p) => p.coordinates).filter((c): c is GeoCoordinates => c != null);
  const commune = points[0]?.commune ?? 'Autre';
  const montantTotal = points.reduce((s, p) => s + p.montantTotal, 0);
  const etendue = methode === 'gps' ? clusterSpanKm(points) : null;
  const ordreSuggere = ordreLivraisonOptimal(points);
  const label =
    methode === 'gps'
      ? `Zone ${index} — ${commune} · ${points.length} cmd${points.length > 1 ? 's' : ''}${etendue != null && etendue > 0 ? ` · ~${formaterDistance(etendue)}` : ''}`
      : `${commune} · ${points.length} cmd${points.length > 1 ? 's' : ''} (adresses sans GPS)`;

  return {
    id: `geo-${methode}-${index}-${commune.toLowerCase().replace(/\s+/g, '-')}`,
    label,
    methode,
    commune,
    orderIds: ordreSuggere,
    commandes: ordreSuggere
      .map((id) => points.find((p) => p.id === id)!)
      .filter(Boolean)
      .map((p) => ({
        id: p.id,
        clientNom: p.clientNom,
        clientVille: p.clientVille,
        clientAdresse: p.clientAdresse,
        montantTotal: p.montantTotal,
      })),
    commandesCount: points.length,
    montantTotal,
    centroid: coords.length > 0 ? centroid(coords) : null,
    etendueKm: etendue,
    ordreSuggere,
  };
}

export class OrderGeoClusteringService {
  async regrouperCommandesEligibles(options?: {
    rayonKm?: number;
    geocoderManquants?: boolean;
    limit?: number;
  }) {
    const rayonKm = options?.rayonKm ?? 2.5;
    const limit = options?.limit ?? 100;

    let rows = await prisma.order.findMany({
      where: {
        courierId: null,
        deliveryRunId: null,
        statut: { notIn: ['LIVREE', 'ANNULEE'] },
      },
      select: {
        id: true,
        clientNom: true,
        clientVille: true,
        clientAdresse: true,
        montantTotal: true,
        clientLatitude: true,
        clientLongitude: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
      take: limit,
    });

    if (options?.geocoderManquants) {
      const sansCoords = rows.filter((r) => !parseCoords(r.clientLatitude, r.clientLongitude));
      for (const row of sansCoords.slice(0, 12)) {
        try {
          await deliveryNavigationService.geocoderCommande(row.id);
        } catch {
          /* ignore geocode failures */
        }
      }
      if (sansCoords.length > 0) {
        rows = await prisma.order.findMany({
          where: { id: { in: rows.map((r) => r.id) } },
          select: {
            id: true,
            clientNom: true,
            clientVille: true,
            clientAdresse: true,
            montantTotal: true,
            clientLatitude: true,
            clientLongitude: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'asc' },
        });
      }
    }

    const points: GeoOrderPoint[] = rows.map((r) => ({
      id: r.id,
      clientNom: r.clientNom,
      clientVille: r.clientVille,
      clientAdresse: r.clientAdresse,
      montantTotal: Number(r.montantTotal),
      coordinates: parseCoords(r.clientLatitude, r.clientLongitude),
      commune: normaliserCommune(r.clientVille),
    }));

    const avecGps = points.filter((p) => p.coordinates);
    const sansGps = points.filter((p) => !p.coordinates);

    const gpsClusters = clusterByDistance(avecGps, rayonKm);
    const groups: GeoOrderGroup[] = [];

    gpsClusters.forEach((cluster, i) => {
      if (cluster.length === 0) return;
      groups.push(toGroup(cluster, 'gps', i + 1));
    });

    const parCommune = new Map<string, GeoOrderPoint[]>();
    for (const p of sansGps) {
      const list = parCommune.get(p.commune) ?? [];
      list.push(p);
      parCommune.set(p.commune, list);
    }

    let communeIdx = 0;
    for (const [, cluster] of parCommune) {
      if (cluster.length === 0) continue;
      communeIdx += 1;
      groups.push(toGroup(cluster, 'commune', communeIdx));
    }

    groups.sort((a, b) => b.commandesCount - a.commandesCount);

    const nonRegroupees = groups.filter((g) => g.commandesCount === 1).length;

    return {
      rayonKm,
      totalEligibles: points.length,
      groupes: groups.filter((g) => g.commandesCount >= 1),
      groupesMulti: groups.filter((g) => g.commandesCount >= 2),
      nonRegroupees,
    };
  }
}

export const orderGeoClusteringService = new OrderGeoClusteringService();
