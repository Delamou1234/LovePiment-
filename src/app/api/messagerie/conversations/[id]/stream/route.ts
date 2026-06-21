import { NextRequest } from 'next/server';
import { getClientSessionFromRequest } from '@/modules/messagerie/lib/chat-auth';
import { conversationService } from '@/modules/messagerie/services/conversation.service';

type Params = Promise<{ id: string }>;

/** GET /api/messagerie/conversations/[id]/stream — SSE temps réel */
export async function GET(request: NextRequest, { params }: { params: Params }) {
  const sessionId = getClientSessionFromRequest(request);
  const { id } = await params;

  if (!sessionId) {
    return new Response('Unauthorized', { status: 401 });
  }

  const allowed = await conversationService.peutAccederClient(id, sessionId);
  if (!allowed) {
    return new Response('Not found', { status: 404 });
  }

  const encoder = new TextEncoder();
  let lastUpdatedAt = '';
  let closed = false;

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: unknown) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      const poll = async () => {
        if (closed) return;
        try {
          const conversation = await conversationService.obtenirSnapshot(id);
          if (!conversation) {
            send({ error: 'not_found' });
            controller.close();
            return;
          }
          if (conversation.updatedAt !== lastUpdatedAt) {
            lastUpdatedAt = conversation.updatedAt;
            send({ type: 'update', conversation });
          } else {
            send({ type: 'heartbeat', at: new Date().toISOString() });
          }
        } catch {
          send({ error: 'server_error' });
        }
      };

      await poll();
      const interval = setInterval(poll, 3000);

      request.signal.addEventListener('abort', () => {
        closed = true;
        clearInterval(interval);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
