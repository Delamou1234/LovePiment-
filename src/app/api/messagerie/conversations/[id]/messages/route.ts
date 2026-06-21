import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getClientAccessFromRequest } from '@/modules/messagerie/lib/client-context';
import { conversationService } from '@/modules/messagerie/services/conversation.service';

type Params = Promise<{ id: string }>;

const messageSchema = z.object({
  type: z.enum(['TEXT', 'IMAGE', 'DOCUMENT', 'VOICE']).default('TEXT'),
  contenu: z.string().max(4000).optional(),
  fichierUrl: z.string().min(1).optional(),
  fichierNom: z.string().max(255).optional(),
  fichierTaille: z.number().int().positive().optional(),
  dureeMs: z.number().int().positive().optional(),
});

/** POST /api/messagerie/conversations/[id]/messages */
export async function POST(request: NextRequest, { params }: { params: Params }) {
  const access = await getClientAccessFromRequest(request);
  if (!access) {
    return NextResponse.json({ message: 'Session requise' }, { status: 401 });
  }

  const { id } = await params;
  const allowed = await conversationService.peutAccederClient(
    id,
    access.sessionId,
    access.userId,
  );
  if (!allowed) {
    return NextResponse.json({ message: 'Conversation introuvable' }, { status: 404 });
  }

  const body = await request.json();
  const parsed = messageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: 'Données invalides' }, { status: 400 });
  }

  const message = await conversationService.envoyerMessage(id, {
    senderRole: 'CLIENT',
    ...parsed.data,
  });

  return NextResponse.json({ message }, { status: 201 });
}
