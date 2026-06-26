import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { adminUnauthorized, requireAdmin } from '@/modules/admin/lib/require-admin';
import { uploadImageToCloudinary, isCloudinaryConfigured } from '@/shared/lib/cloudinary';
import { isMediaFolder, validateImageUpload } from '@/shared/lib/media-upload';

export const runtime = 'nodejs';

const bodySchema = z.object({
  folder: z.string().refine(isMediaFolder, 'Dossier média invalide'),
});

/** POST /api/admin/media/upload — téléversement image admin → Cloudinary (URL seule en base) */
export async function POST(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return adminUnauthorized();

  if (!isCloudinaryConfigured()) {
    return NextResponse.json(
      {
        message:
          'Cloudinary non configuré. Ajoutez CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY et CLOUDINARY_API_SECRET dans .env.local',
      },
      { status: 503 },
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const folderRaw = String(formData.get('folder') ?? 'misc');

    const folderParsed = bodySchema.safeParse({ folder: folderRaw });
    if (!folderParsed.success) {
      return NextResponse.json({ message: 'Dossier média invalide' }, { status: 400 });
    }

    if (!(file instanceof File)) {
      return NextResponse.json({ message: 'Fichier image requis' }, { status: 400 });
    }

    const validationError = validateImageUpload(file);
    if (validationError) {
      return NextResponse.json({ message: validationError }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const uploaded = await uploadImageToCloudinary(buffer, folderParsed.data.folder);

    return NextResponse.json({
      url: uploaded.url,
      publicId: uploaded.publicId,
      width: uploaded.width,
      height: uploaded.height,
      message: 'Image téléversée sur Cloudinary',
    });
  } catch (error) {
    console.error('[POST /api/admin/media/upload]', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Erreur de téléversement' },
      { status: 500 },
    );
  }
}
