import { NextRequest, NextResponse } from 'next/server';
import { courierRepository } from '@/modules/livraison/repository/courier.repository';
import { adminUnauthorized, requireAdmin } from '@/modules/admin/lib/require-admin';
import { isCloudinaryConfigured, uploadImageToCloudinary } from '@/shared/lib/cloudinary';
import { validateImageUpload } from '@/shared/lib/media-upload';

export const runtime = 'nodejs';

type Params = Promise<{ id: string }>;

/** POST /api/admin/livreurs/[id]/photo — photo livreur sur Cloudinary */
export async function POST(request: NextRequest, { params }: { params: Params }) {
  const admin = await requireAdmin();
  if (!admin) return adminUnauthorized();

  if (!isCloudinaryConfigured()) {
    return NextResponse.json(
      { message: 'Cloudinary non configuré pour le téléversement des photos livreur' },
      { status: 503 },
    );
  }

  const { id } = await params;
  const livreur = await courierRepository.trouverParId(id);
  if (!livreur) {
    return NextResponse.json({ message: 'Livreur introuvable' }, { status: 404 });
  }

  const formData = await request.formData();
  const file = formData.get('file');

  if (!(file instanceof File)) {
    return NextResponse.json({ message: 'Fichier requis' }, { status: 400 });
  }

  const validationError = validateImageUpload(file);
  if (validationError) {
    return NextResponse.json({ message: validationError }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const uploaded = await uploadImageToCloudinary(buffer, 'couriers');
  const updated = await courierRepository.mettreAJour(id, { photoUrl: uploaded.url });

  return NextResponse.json({
    livreur: {
      id: updated.id,
      nom: updated.nom,
      photoUrl: updated.photoUrl,
    },
    url: uploaded.url,
    message: 'Photo du livreur mise à jour',
  });
}

/** DELETE /api/admin/livreurs/[id]/photo */
export async function DELETE(_request: NextRequest, { params }: { params: Params }) {
  const admin = await requireAdmin();
  if (!admin) return adminUnauthorized();

  const { id } = await params;
  const livreur = await courierRepository.trouverParId(id);
  if (!livreur) {
    return NextResponse.json({ message: 'Livreur introuvable' }, { status: 404 });
  }

  const updated = await courierRepository.mettreAJour(id, { photoUrl: null });

  return NextResponse.json({
    livreur: {
      id: updated.id,
      nom: updated.nom,
      photoUrl: updated.photoUrl,
    },
    message: 'Photo du livreur supprimée',
  });
}
