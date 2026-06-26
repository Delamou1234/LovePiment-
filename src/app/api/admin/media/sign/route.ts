import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { adminUnauthorized, requireAdmin } from '@/modules/admin/lib/require-admin';
import {
  createDirectUploadSignature,
  isCloudinaryConfigured,
} from '@/shared/lib/cloudinary';
import { isMediaFolder } from '@/shared/lib/media-upload';

export const runtime = 'nodejs';

const bodySchema = z.object({
  folder: z.string().refine(isMediaFolder, 'Dossier média invalide'),
});

/** POST /api/admin/media/sign — signature pour upload direct rapide vers Cloudinary */
export async function POST(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return adminUnauthorized();

  if (!isCloudinaryConfigured()) {
    return NextResponse.json(
      { message: 'Cloudinary non configuré' },
      { status: 503 },
    );
  }

  try {
    const body = await request.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ message: 'Dossier média invalide' }, { status: 400 });
    }

    const sign = createDirectUploadSignature(parsed.data.folder);
    return NextResponse.json(sign);
  } catch (error) {
    console.error('[POST /api/admin/media/sign]', error);
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 });
  }
}
