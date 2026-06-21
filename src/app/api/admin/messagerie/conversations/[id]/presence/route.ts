import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/modules/messagerie/lib/chat-auth';
import { conversationService } from '@/modules/messagerie/services/conversation.service';

type Params = Promise<{ id: string }>;

const presenceSchema = z.object({
  participantId: z.string().min(1),
  isTyping: z.boolean().optional(),
});

/** POST /api/admin/messagerie/conversations/[id]/presence */
export async function POST(request: NextRequest, { params }: { params: Params }) {
  const user = await requireAdmin();
  if (!user) {
    return NextResponse.json({ message: 'Non autorisé' }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const parsed = presenceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: 'Données invalides' }, { status: 400 });
  }

  const presence = await conversationService.heartbeat(
    id,
    'VENDEUR',
    parsed.data.participantId,
    parsed.data.isTyping,
  );

  return NextResponse.json({ presence });
}
