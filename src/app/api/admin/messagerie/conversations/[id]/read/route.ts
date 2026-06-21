import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/modules/messagerie/lib/chat-auth';
import { conversationService } from '@/modules/messagerie/services/conversation.service';

type Params = Promise<{ id: string }>;

/** PATCH /api/admin/messagerie/conversations/[id]/read */
export async function PATCH(_request: NextRequest, { params }: { params: Params }) {
  const user = await requireAdmin();
  if (!user) {
    return NextResponse.json({ message: 'Non autorisé' }, { status: 401 });
  }

  const { id } = await params;
  await conversationService.obtenirDetail(id, 'VENDEUR');
  return NextResponse.json({ ok: true });
}
