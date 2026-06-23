export type GaEventType =
  | 'PAGE_VIEW'
  | 'PRODUCT_VIEW'
  | 'ADD_TO_CART'
  | 'CHECKOUT_START'
  | 'ORDER_PLACED';

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export function sendGaEvent(
  type: GaEventType,
  data?: { productId?: string; path?: string; value?: number },
): void {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return;

  switch (type) {
    case 'PAGE_VIEW':
      window.gtag('event', 'page_view', {
        page_path: data?.path ?? window.location.pathname,
        page_location: window.location.href,
      });
      break;
    case 'PRODUCT_VIEW':
      window.gtag('event', 'view_item', {
        items: data?.productId ? [{ item_id: data.productId }] : undefined,
      });
      break;
    case 'ADD_TO_CART':
      window.gtag('event', 'add_to_cart', {
        items: data?.productId ? [{ item_id: data.productId }] : undefined,
      });
      break;
    case 'CHECKOUT_START':
      window.gtag('event', 'begin_checkout', {
        value: data?.value,
        currency: 'GNF',
      });
      break;
    case 'ORDER_PLACED':
      window.gtag('event', 'purchase', {
        value: data?.value,
        currency: 'GNF',
      });
      break;
  }
}
