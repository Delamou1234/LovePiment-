import { NextRequest, NextResponse } from 'next/server';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';
import { getCustomerSessionWithCourierFallback } from '@/shared/lib/auth/customer-from-courier';
import { customerProfileService } from '@/modules/compte/services/customer-profile.service';
import { parseUploadedImage } from '@/shared/lib/upload-image';

export const runtime = 'nodejs';

function unauthorized() {
  return NextResponse.json({ message: 'Connexion requise' }, { status: 401 });
}

/** POST /api/compte/avatar — upload photo de profil */
export async function POST(request: NextRequest) {
  const session = await getCustomerSessionWithCourierFallback();
  if (!session?.id) return unauthorized();

  const formData = await request.formData();
  const parsed = parseUploadedImage(formData.get('file'));

  if (!parsed.ok) {
    return NextResponse.json({ message: parsed.message }, { status: 400 });
  }

  const filename = `${session.id}-${randomUUID()}.${parsed.ext}`;
  const dir = join(process.cwd(), 'public', 'uploads', 'avatars');

  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, filename), Buffer.from(await parsed.blob.arrayBuffer()));

  const url = `/uploads/avatars/${filename}`;
  const profil = await customerProfileService.mettreAJourAvatar(session.id, url);

  if (!profil) {
    return NextResponse.json({ message: 'Compte introuvable' }, { status: 404 });
  }

  return NextResponse.json({ profil, url, message: 'Photo de profil mise à jour' });
}

/** DELETE /api/compte/avatar — supprimer la photo uploadée */
export async function DELETE() {
  const session = await getCustomerSessionWithCourierFallback();
  if (!session?.id) return unauthorized();

  const profil = await customerProfileService.supprimerAvatar(session.id);
  if (!profil) {
    return NextResponse.json({ message: 'Compte introuvable' }, { status: 404 });
  }

  return NextResponse.json({ profil, message: 'Photo de profil supprimée' });
}
