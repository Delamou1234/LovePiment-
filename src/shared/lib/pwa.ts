/**
 * Configuration PWA boutique client (Love Piment&).
 */

export const PWA_SW_PATH = '/sw.js';
export const PWA_INSTALL_DISMISS_KEY = 'lovepiment_pwa_install_dismissed_v1';
export const PWA_INSTALL_DONE_KEY = 'lovepiment_pwa_installed_v1';

/** Routes où la PWA client est proposée (hors admin / livreur). */
export function isClientPwaRoute(pathname: string): boolean {
  if (pathname.startsWith('/admin') || pathname.startsWith('/livreur')) return false;
  if (pathname.startsWith('/api')) return false;
  return true;
}

export function isStandaloneDisplayMode(): boolean {
  if (typeof window === 'undefined') return false;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches ||
    nav.standalone === true
  );
}

export function isIosSafari(): boolean {
  if (typeof window === 'undefined') return false;
  const ua = window.navigator.userAgent;
  const isIos = /iPad|iPhone|iPod/.test(ua);
  const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua);
  return isIos && isSafari;
}

export function isMobileViewport(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(max-width: 768px)').matches;
}
