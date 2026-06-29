import { trackingService } from '@/modules/livraison/services/tracking.service';
import { requireAdmin } from '@/modules/admin/lib/require-admin';
import { closeSseStream, createSseSender, bindSseLifecycle, getSseMaxMs } from '@/shared/lib/sse-stream';

/** GET /api/admin/notifications/stream — SSE avis clients en temps réel */
export async function GET(request: Request) {
  const user = await requireAdmin();
  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const encoder = new TextEncoder();
  const sentIds = new Set<string>();
  let closed = false;
  let interval: ReturnType<typeof setInterval> | undefined;
  const since = new Date();

  const shutdown = () => {
    closed = true;
  };

  const stream = new ReadableStream({
    async start(controller) {
      const send = createSseSender(controller, encoder, () => closed, shutdown);

      const poll = async () => {
        if (closed) return;
        try {
          const notifications = await trackingService.listerNotificationsAdminDepuis(since);
          const nouvelles = notifications.filter((n) => !sentIds.has(n.id));
          if (nouvelles.length > 0) {
            for (const n of nouvelles) sentIds.add(n.id);
            send({ type: 'notifications', notifications: nouvelles });
          } else {
            send({ type: 'heartbeat', at: new Date().toISOString() });
          }
        } catch {
          send({ error: 'server_error' });
        }
      };

      await poll();
      interval = setInterval(poll, 10_000);

      bindSseLifecycle(request, getSseMaxMs(), () => {
        if (interval) clearInterval(interval);
        closeSseStream(controller, () => closed, shutdown);
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
