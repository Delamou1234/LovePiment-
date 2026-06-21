/** Chemins autorisés après connexion (évite les open redirects). */
const ALLOWED_PREFIXES = [
  '/admin',
  '/commande',
  '/panier',
  '/compte',
  '/produits',
  '/favoris',
  '/suivi',
];

export function getSafeRedirect(
  redirect: string | null | undefined,
  fallback = '/',
): string {
  if (!redirect || !redirect.startsWith('/') || redirect.startsWith('//')) {
    return fallback;
  }

  const path = redirect.split('?')[0];

  if (path === '/') return redirect;

  for (const prefix of ALLOWED_PREFIXES) {
    if (path === prefix || path.startsWith(`${prefix}/`)) {
      return redirect;
    }
  }

  return fallback;
}

export function isAdminRedirect(redirect: string | null | undefined): boolean {
  if (!redirect) return false;
  const path = redirect.split('?')[0];
  return path === '/admin' || path.startsWith('/admin/');
}

export function isCheckoutRedirect(redirect: string | null | undefined): boolean {
  if (!redirect) return false;
  const path = redirect.split('?')[0];
  return path === '/commande' || path.startsWith('/commande/');
}
