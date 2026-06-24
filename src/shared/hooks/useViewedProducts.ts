'use client';

const STORAGE_KEY = 'lovepiment-viewed-products';
const MAX_ITEMS = 20;

export function getViewedProductIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as string[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function trackViewedProduct(productId: string): void {
  if (typeof window === 'undefined' || !productId) return;
  const current = getViewedProductIds().filter((id) => id !== productId);
  current.unshift(productId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(current.slice(0, MAX_ITEMS)));
}

export function getCartProductIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem('lovepiment-panier');
    if (!raw) return [];
    const parsed = JSON.parse(raw) as { state?: { items?: { productId: string }[] } };
    return (parsed.state?.items ?? []).map((i) => i.productId);
  } catch {
    return [];
  }
}
