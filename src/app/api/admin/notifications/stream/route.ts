import { trackingService } from '@/modules/livraison/services/tracking.service';
import { adminUnauthorized, requireAdmin } from '@/modules/admin/lib/require-admin';

/** GET /api/admin/notifications/stream — SSE avis clients en temps réel */
export async function GET(request: Request) {
  const user = await requireAdmin();
  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const encoder = new TextEncoder();
  const sentIds = new Set<string>();
  let closed = false;
  const since = new Date();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: unknown) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      const poll = async () => {
        if (closed) return;
        try {
          const notifications = await trackingService.listerNotificationsSatisfaction(since);
          const nouvelles = notifications.filter((n) => !sentIds.has(n.id));
          if (nouvelles.length > 0) {
            for (const n of nouvelles) sentIds.add(n.id);
            send({ type: 'satisfaction', notifications: nouvelles });
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
