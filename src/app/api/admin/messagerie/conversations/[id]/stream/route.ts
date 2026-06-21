import { requireAdmin } from '@/modules/messagerie/lib/chat-auth';
import { conversationService } from '@/modules/messagerie/services/conversation.service';

type Params = Promise<{ id: string }>;

/** GET /api/admin/messagerie/conversations/[id]/stream — SSE admin */
export async function GET(request: Request, { params }: { params: Params }) {
  const user = await requireAdmin();
  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { id } = await params;
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
