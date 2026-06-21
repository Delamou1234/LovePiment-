import type { NextRequest } from 'next/server';
import { getCustomerSession } from '@/shared/lib/auth/session';
import { getClientSessionFromRequest } from './chat-auth';

export type ChatClientContext = {
  sessionId: string;
  userId: string | null;
  nom: string;
  telephone: string | null;
};

export async function resolveChatClientContext(
  request: NextRequest,
): Promise<ChatClientContext | null> {
  const sessionId = getClientSessionFromRequest(request);
  if (!sessionId) return null;

  const customer = await getCustomerSession();
  if (customer?.id) {
    return {
      sessionId,
      userId: customer.id,
      nom: customer.name,
      telephone: null,
    };
  }

  return {
    sessionId,
    userId: null,
    nom: 'Visiteur',
    telephone: null,
  };
}

export async function getClientAccessFromRequest(
  request: NextRequest,
): Promise<{ sessionId: string; userId: string | null } | null> {
  const ctx = await resolveChatClientContext(request);
  if (!ctx) return null;
  return { sessionId: ctx.sessionId, userId: ctx.userId };
}
