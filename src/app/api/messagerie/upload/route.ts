import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { NextRequest, NextResponse } from 'next/server';
import { getClientAccessFromRequest } from '@/modules/messagerie/lib/client-context';
import { requireAdmin } from '@/modules/messagerie/lib/chat-auth';
import { conversationService } from '@/modules/messagerie/services/conversation.service';

const MAX_IMAGE = 5 * 1024 * 1024;
const MAX_DOC = 10 * 1024 * 1024;
const MAX_VOICE = 5 * 1024 * 1024;

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const DOC_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
];
const VOICE_TYPES = ['audio/webm', 'audio/ogg', 'audio/mpeg', 'audio/mp4', 'audio/wav'];

function extFromMime(mime: string): string {
  const map: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'application/pdf': 'pdf',
    'application/msword': 'doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
    'text/plain': 'txt',
    'audio/webm': 'webm',
    'audio/ogg': 'ogg',
    'audio/mpeg': 'mp3',
    'audio/mp4': 'm4a',
    'audio/wav': 'wav',
  };
  return map[mime] ?? 'bin';
}

function messageTypeFromMime(mime: string): 'IMAGE' | 'DOCUMENT' | 'VOICE' | null {
  if (IMAGE_TYPES.includes(mime)) return 'IMAGE';
  if (DOC_TYPES.includes(mime)) return 'DOCUMENT';
  if (VOICE_TYPES.includes(mime)) return 'VOICE';
  return null;
}

/** POST /api/messagerie/upload */
export async function POST(request: NextRequest) {
  const form = await request.formData();
  const conversationId = form.get('conversationId')?.toString();
  const file = form.get('file');

  if (!conversationId || !(file instanceof File)) {
    return NextResponse.json({ message: 'Fichier ou conversation manquant' }, { status: 400 });
  }

  const admin = await requireAdmin();
  const access = await getClientAccessFromRequest(request);

  if (admin) {
    // admin ok
  } else if (access) {
    const allowed = await conversationService.peutAccederClient(
      conversationId,
      access.sessionId,
      access.userId,
    );
    if (!allowed) {
      return NextResponse.json({ message: 'Non autorisé' }, { status: 403 });
    }
  } else {
    return NextResponse.json({ message: 'Non autorisé' }, { status: 401 });
  }

  const msgType = messageTypeFromMime(file.type);
  if (!msgType) {
    return NextResponse.json({ message: 'Type de fichier non supporté' }, { status: 400 });
  }

  const maxSize =
    msgType === 'IMAGE' ? MAX_IMAGE : msgType === 'VOICE' ? MAX_VOICE : MAX_DOC;
  if (file.size > maxSize) {
    return NextResponse.json({ message: 'Fichier trop volumineux' }, { status: 400 });
  }

  const ext = extFromMime(file.type);
  const filename = `${crypto.randomUUID()}.${ext}`;
  const dir = path.join(process.cwd(), 'public', 'uploads', 'chat', conversationId);
  await mkdir(dir, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, filename), buffer);

  const url = `/uploads/chat/${conversationId}/${filename}`;

  return NextResponse.json({
    url,
    nom: file.name,
    taille: file.size,
    type: msgType,
  });
}
