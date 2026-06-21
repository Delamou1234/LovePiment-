type SseController = ReadableStreamDefaultController<Uint8Array>;

/** Envoie un événement SSE en ignorant les écritures après fermeture du flux. */
export function createSseSender(
  controller: SseController,
  encoder: TextEncoder,
  isClosed: () => boolean,
  onClosed: () => void,
) {
  return (data: unknown) => {
    if (isClosed()) return;
    try {
      controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
    } catch {
      onClosed();
    }
  };
}

export function closeSseStream(
  controller: SseController,
  isClosed: () => boolean,
  onClosed: () => void,
) {
  if (isClosed()) return;
  onClosed();
  try {
    controller.close();
  } catch {
    /* déjà fermé */
  }
}

/** Ferme le flux SSE après une durée max ou à la déconnexion client. */
export function bindSseLifecycle(
  request: Request,
  maxMs: number,
  cleanup: () => void,
): void {
  let done = false;
  const finish = () => {
    if (done) return;
    done = true;
    cleanup();
  };

  const timer = setTimeout(finish, maxMs);
  request.signal.addEventListener('abort', () => {
    clearTimeout(timer);
    finish();
  });
}

export function getSseMaxMs(): number {
  const parsed = Number(process.env.SSE_MAX_MS ?? 300_000);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 300_000;
}
