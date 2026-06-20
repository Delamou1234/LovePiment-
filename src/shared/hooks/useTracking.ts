'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

type EventType = 'PAGE_VIEW' | 'PRODUCT_VIEW' | 'ADD_TO_CART' | 'CHECKOUT_START' | 'ORDER_PLACED';

/**
 * Envoie un événement analytics au serveur (fire and forget).
 * N'attend pas de réponse et ne bloque jamais le rendu.
 */
export async function trackEvent(
  type: EventType,
  data?: { productId?: string; path?: string; sessionId?: string },
): Promise<void> {
  try {
    await fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, ...data }),
    });
  } catch {
    // Silencieux — le tracking ne doit jamais impacter l'UX
  }
}

/**
 * Hook qui trackera automatiquement les pages vues.
 * À placer dans le layout de la boutique.
 */
export function usePageTracking() {
  const pathname = usePathname();
  const lastTracked = useRef<string>('');

  useEffect(() => {
    if (pathname && pathname !== lastTracked.current) {
      lastTracked.current = pathname;
      void trackEvent('PAGE_VIEW', { path: pathname });
    }
  }, [pathname]);
}
