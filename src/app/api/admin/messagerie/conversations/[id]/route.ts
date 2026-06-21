import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/modules/messagerie/lib/chat-auth';
import { conversationService } from '@/modules/messagerie/services/conversation.service';

type Params = Promise<{ id: string }>;

/** GET /api/admin/messagerie/conversations/[id] */
export async function GET(_request: NextRequest, { params }: { params: Params }) {
  const user = await requireAdmin();
  if (!user) {
    return NextResponse.json({ message: 'Non autorisé' }, { status: 401 });
  }

  const { id } = await params;
  const conversation = await conversationService.obtenirDetail(id, 'VENDEUR');
  if (!conversation) {
    return NextResponse.json({ message: 'Conversation introuvable' }, { status: 404 });
  }

  return NextResponse.json({ conversation });
}
