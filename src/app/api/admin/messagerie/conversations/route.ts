import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/modules/messagerie/lib/chat-auth';
import { conversationService } from '@/modules/messagerie/services/conversation.service';

/** GET /api/admin/messagerie/conversations */
export async function GET() {
  const user = await requireAdmin();
  if (!user) {
    return NextResponse.json({ message: 'Non autorisé' }, { status: 401 });
  }

  const conversations = await conversationService.listerPourAdmin();
  return NextResponse.json({ conversations });
}
