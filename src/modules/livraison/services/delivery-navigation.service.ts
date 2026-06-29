import { prisma } from '@/shared/lib/prisma';
import { geocodeAddress } from '@/shared/lib/geolocation/forward-geocode';
import type { GeoCoordinates } from '@/shared/lib/geolocation/forward-geocode';
import type { OrderStatus } from '@prisma/client';

export type LivraisonNavigationDto = {
  id: string;
  livraisonNavToken: string;
  statut: OrderStatus;
  clientNom: string;
  clientTelephone: string;
  clientAdresse: string;
  clientVille: string;
  montantTotal: number;
  modePaiement: string;
  statutPaiement: string;
  coordinates: GeoCoordinates | null;
  transporteur: { nom: string; telephone: string | null } | null;
  priseEnCharge: boolean;
};

async function resolveCoordinates(
  orderId: string,
  adresse: string,
  ville: string,
  existingLat: unknown,
  existingLon: unknown,
  force = false,
): Promise<GeoCoordinates | null> {
  if (!force && existingLat != null && existingLon != null) {
    const latitude = Number(existingLat);
    const longitude = Number(existingLon);
    if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
      return { latitude, longitude };
    }
  }

  const coords = await geocodeAddress(adresse, ville);
  if (!coords) return null;

  await prisma.order.update({
    where: { id: orderId },
    data: {
      clientLatitude: coords.latitude,
      clientLongitude: coords.longitude,
    },
  });

  return coords;
}

export class DeliveryNavigationService {
  async obtenirParToken(token: string): Promise<LivraisonNavigationDto | null> {
    const order = await prisma.order.findUnique({
      where: { livraisonNavToken: token },
      include: { carrier: true },
    });

    if (!order || order.statut === 'ANNULEE') return null;

    const coordinates = await resolveCoordinates(
      order.id,
      order.clientAdresse,
      order.clientVille,
      order.clientLatitude,
      order.clientLongitude,
    );

    return this.toDto(order, coordinates);
  }

  /** Accès navigation réservé au livreur assigné à la commande. */
  async obtenirParTokenPourLivreur(
    token: string,
    courierId: string,
  ): Promise<LivraisonNavigationDto | null> {
    const order = await prisma.order.findFirst({
      where: { livraisonNavToken: token, courierId },
      include: { carrier: true },
    });

    if (!order || order.statut === 'ANNULEE') return null;

    const coordinates = await resolveCoordinates(
      order.id,
      order.clientAdresse,
      order.clientVille,
      order.clientLatitude,
      order.clientLongitude,
    );

    return this.toDto(order, coordinates);
  }

  async obtenirParIdAdmin(orderId: string): Promise<LivraisonNavigationDto | null> {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { carrier: true },
    });
    if (!order || order.statut === 'ANNULEE') return null;

    const coordinates = await resolveCoordinates(
      order.id,
      order.clientAdresse,
      order.clientVille,
      order.clientLatitude,
      order.clientLongitude,
    );

    return this.toDto(order, coordinates);
  }

  async geocoderCommande(orderId: string, force = false): Promise<GeoCoordinates | null> {
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) return null;

    return resolveCoordinates(
      order.id,
      order.clientAdresse,
      order.clientVille,
      order.clientLatitude,
      order.clientLongitude,
      force,
    );
  }

  async definirCoordonnees(
    orderId: string,
    latitude: number,
    longitude: number,
  ): Promise<GeoCoordinates> {
    await prisma.order.update({
      where: { id: orderId },
      data: { clientLatitude: latitude, clientLongitude: longitude },
    });
    return { latitude, longitude };
  }

  private toDto(
    order: {
      id: string;
      livraisonNavToken: string;
      statut: OrderStatus;
      clientNom: string;
      clientTelephone: string;
      clientAdresse: string;
      clientVille: string;
      montantTotal: unknown;
      modePaiement: string;
      statutPaiement: string;
      carrier: { nom: string; telephone: string | null } | null;
      livreurPriseEnChargeAt?: Date | null;
      livreurPriseEnChargeAck?: boolean | null;
    },
    coordinates: GeoCoordinates | null,
  ): LivraisonNavigationDto {
    return {
      id: order.id,
      livraisonNavToken: order.livraisonNavToken,
      statut: order.statut,
      clientNom: order.clientNom,
      clientTelephone: order.clientTelephone,
      clientAdresse: order.clientAdresse,
      clientVille: order.clientVille,
      montantTotal: Number(order.montantTotal),
      modePaiement: order.modePaiement,
      statutPaiement: order.statutPaiement,
      coordinates,
      transporteur: order.carrier
        ? { nom: order.carrier.nom, telephone: order.carrier.telephone }
        : null,
      priseEnCharge: Boolean(order.livreurPriseEnChargeAt && order.livreurPriseEnChargeAck),
    };
  }
}

export const deliveryNavigationService = new DeliveryNavigationService();
