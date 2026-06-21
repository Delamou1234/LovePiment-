import { NextRequest, NextResponse } from 'next/server';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';
import { getCustomerSession } from '@/shared/lib/auth/session';

export const runtime = 'nodejs';

const MAX_SIZE = 2 * 1024 * 1024;
const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp']);

/** POST /api/avis/upload */
export async function POST(request: NextRequest) {
  const session = await getCustomerSession();
  if (!session?.id) {
    return NextResponse.json({ message: 'Connexion requise' }, { status: 401 });
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
  const filename = `${randomUUID()}.${ext}`;
  const dir = join(process.cwd(), 'public', 'uploads', 'avis');

  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, filename), Buffer.from(await file.arrayBuffer()));

  return NextResponse.json({ url: `/uploads/avis/${filename}` });
}
