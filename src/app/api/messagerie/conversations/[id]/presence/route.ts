import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getClientSessionFromRequest } from '@/modules/messagerie/lib/chat-auth';
import { conversationService } from '@/modules/messagerie/services/conversation.service';

type Params = Promise<{ id: string }>;

const presenceSchema = z.object({
  participantId: z.string().min(1),
  isTyping: z.boolean().optional(),
});

/** POST /api/messagerie/conversations/[id]/presence — heartbeat client */
export async function POST(request: NextRequest, { params }: { params: Params }) {
  const sessionId = getClientSessionFromRequest(request);
  if (!sessionId) {
    return NextResponse.json({ message: 'Session requise' }, { status: 401 });
  }

  const { id } = await params;
  const allowed = await conversationService.peutAccederClient(id, sessionId);
  if (!allowed) {
    return NextResponse.json({ message: 'Conversation introuvable' }, { status: 404 });
  }

  const body = await request.json();
  const parsed = presenceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: 'Données invalides' }, { status: 400 });
  }

  const presence = await conversationService.heartbeat(
    id,
    'CLIENT',
    parsed.data.participantId,
    parsed.data.isTyping,
  );

  return NextResponse.json({ presence });
}
