'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

type EventType = 'PAGE_VIEW' | 'PRODUCT_VIEW' | 'ADD_TO_CART' | 'CHECKOUT_START' | 'ORDER_PLACED';

/**
 * Envoie un événement analytics sans bloquer le thread principal.
 */
export function trackEvent(
  type: EventType,
  data?: { productId?: string; path?: string; sessionId?: string },
): void {
  if (typeof window === 'undefined') return;

  const payload = JSON.stringify({ type, ...data });

  try {
    if (navigator.sendBeacon) {
      const sent = navigator.sendBeacon(
        '/api/track',
        new Blob([payload], { type: 'application/json' }),
      );
      if (sent) return;
    }
  } catch {
    /* fallback fetch */
  }

  void fetch('/api/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: payload,
    keepalive: true,
  }).catch(() => {});
}

/**
 * Hook qui track automatiquement les pages vues (debounce navigation rapide).
 */
export function usePageTracking() {
  const pathname = usePathname();
  const lastTracked = useRef<string>('');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!pathname || pathname === lastTracked.current) return;

    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      lastTracked.current = pathname;
      trackEvent('PAGE_VIEW', { path: pathname });
    }, 400);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [pathname]);
}
