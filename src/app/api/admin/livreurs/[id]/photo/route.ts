import { NextRequest, NextResponse } from 'next/server';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';
import { courierRepository } from '@/modules/livraison/repository/courier.repository';
import { adminUnauthorized, requireAdmin } from '@/modules/admin/lib/require-admin';

export const runtime = 'nodejs';

type Params = Promise<{ id: string }>;

const MAX_SIZE = 2 * 1024 * 1024;
const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp']);

/** POST /api/admin/livreurs/[id]/photo */
export async function POST(request: NextRequest, { params }: { params: Params }) {
  const admin = await requireAdmin();
  if (!admin) return adminUnauthorized();

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

  if (!ALLOWED.has(file.type)) {
    return NextResponse.json({ message: 'Format JPG, PNG ou WebP uniquement' }, { status: 400 });
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ message: 'Image trop lourde (max 2 Mo)' }, { status: 400 });
  }

  const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
  const filename = `${id}-${randomUUID()}.${ext}`;
  const dir = join(process.cwd(), 'public', 'uploads', 'livreurs');

  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, filename), Buffer.from(await file.arrayBuffer()));

  const url = `/uploads/livreurs/${filename}`;
  const updated = await courierRepository.mettreAJour(id, { photoUrl: url });

  return NextResponse.json({
    livreur: {
      id: updated.id,
      nom: updated.nom,
      photoUrl: updated.photoUrl,
    },
    url,
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
