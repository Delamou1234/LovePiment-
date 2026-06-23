import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { deliveryNavigationService } from '@/modules/livraison/services/delivery-navigation.service';
import { adminUnauthorized, requireAdmin } from '@/modules/admin/lib/require-admin';

type Params = Promise<{ id: string }>;

const coordsSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

/** GET /api/admin/commandes/[id]/livraison — lien + coordonnées pour partage livreur */
export async function GET(_request: NextRequest, { params }: { params: Params }) {
  const admin = await requireAdmin();
  if (!admin) return adminUnauthorized();

  const { id } = await params;
  const livraison = await deliveryNavigationService.obtenirParIdAdmin(id);
  if (!livraison) {
    return NextResponse.json({ message: 'Commande introuvable' }, { status: 404 });
  }

  return NextResponse.json({ livraison });
}

/** POST /api/admin/commandes/[id]/livraison — géocoder ou forcer mise à jour GPS */
export async function POST(request: NextRequest, { params }: { params: Params }) {
  const admin = await requireAdmin();
  if (!admin) return adminUnauthorized();

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const force = Boolean((body as { force?: boolean }).force);

  const coords = await deliveryNavigationService.geocoderCommande(id, force);
  if (!coords) {
    return NextResponse.json(
      { message: 'Impossible de localiser cette adresse. Vérifiez l’adresse client.' },
      { status: 422 },
    );
  }

  const livraison = await deliveryNavigationService.obtenirParIdAdmin(id);
  return NextResponse.json({ livraison, coordinates: coords });
}

/** PATCH /api/admin/commandes/[id]/livraison — position manuelle (admin) */
export async function PATCH(request: NextRequest, { params }: { params: Params }) {
  const admin = await requireAdmin();
  if (!admin) return adminUnauthorized();

  const { id } = await params;
  const parsed = coordsSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ message: 'Coordonnées invalides' }, { status: 400 });
  }

  await deliveryNavigationService.definirCoordonnees(
    id,
    parsed.data.latitude,
    parsed.data.longitude,
  );

  const livraison = await deliveryNavigationService.obtenirParIdAdmin(id);
  return NextResponse.json({ livraison });
}
