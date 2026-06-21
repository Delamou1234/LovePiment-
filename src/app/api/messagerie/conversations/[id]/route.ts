import { NextRequest, NextResponse } from 'next/server';
import { getClientSessionFromRequest } from '@/modules/messagerie/lib/chat-auth';
import { conversationService } from '@/modules/messagerie/services/conversation.service';

type Params = Promise<{ id: string }>;

/** GET /api/messagerie/conversations/[id] */
export async function GET(request: NextRequest, { params }: { params: Params }) {
  const sessionId = getClientSessionFromRequest(request);
  if (!sessionId) {
    return NextResponse.json({ message: 'Session requise' }, { status: 401 });
  }

  const { id } = await params;
  const allowed = await conversationService.peutAccederClient(id, sessionId);
  if (!allowed) {
    return NextResponse.json({ message: 'Conversation introuvable' }, { status: 404 });
  }

  const conversation = await conversationService.obtenirDetail(id, 'CLIENT');
  return NextResponse.json({ conversation });
}
