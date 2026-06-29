/** Chemins autorisés après connexion (évite les open redirects). */
const ALLOWED_PREFIXES = [
  '/admin',
  '/livreur',
  '/commande',
  '/panier',
  '/compte',
  '/produits',
  '/favoris',
  '/suivi',
];

/** Redirect post-connexion client : jamais vers /admin ni l'accueil sans intention explicite. */
export function getSafeRedirectForCustomer(
  redirect: string | null | undefined,
  fallback = '/compte',
): string {
  if (!redirect || redirect.startsWith('//')) return fallback;
  const path = redirect.split('?')[0];
  if (path === '/' || isAdminRedirect(redirect) || isCourierRedirect(redirect)) return fallback;
  return getSafeRedirect(redirect, fallback);
}

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

export function isCourierRedirect(redirect: string | null | undefined): boolean {
  if (!redirect) return false;
  const path = redirect.split('?')[0];
  return path === '/livreur' || path.startsWith('/livreur/');
}

export function isShopRedirect(redirect: string | null | undefined): boolean {
  if (!redirect) return false;
  const path = redirect.split('?')[0];
  return (
    path === '/panier' ||
    path.startsWith('/panier/') ||
    path === '/produits' ||
    path.startsWith('/produits/') ||
    path === '/promos' ||
    path.startsWith('/promos/') ||
    isCheckoutRedirect(redirect) ||
    path === '/compte' ||
    path.startsWith('/compte/')
  );
}

/** Redirection après connexion si l'utilisateur a déjà une session. */
export function resolveAuthenticatedRedirect(
  sessions: { customer: boolean; admin: boolean; courier: boolean },
  redirectParam?: string | null,
): string | null {
  const { customer, admin, courier } = sessions;

  if (isCourierRedirect(redirectParam) && courier) {
    return getPostLoginRedirect('courier', redirectParam);
  }
  if (isAdminRedirect(redirectParam) && admin) {
    return getPostLoginRedirect('admin', redirectParam);
  }
  if (customer && (isCheckoutRedirect(redirectParam) || redirectParam?.startsWith('/compte'))) {
    return getPostLoginRedirect('customer', redirectParam);
  }
  if (courier && isShopRedirect(redirectParam)) {
    return getSafeRedirect(redirectParam, '/produits');
  }
  if (courier && !customer && !admin) return '/livreur';
  if (admin && !customer && !courier) return '/admin';
  if (customer) return getPostLoginRedirect('customer', redirectParam);
  if (courier) return '/livreur';
  if (admin) return '/admin';
  return null;
}

/** URL cible après connexion réussie, selon le rôle réellement authentifié. */
export function getPostLoginRedirect(
  role: 'admin' | 'customer' | 'courier',
  redirect: string | null | undefined,
): string {
  if (role === 'admin') {
    return isAdminRedirect(redirect) ? getSafeRedirect(redirect, '/admin') : '/admin';
  }
  if (role === 'courier') {
    if (isCourierRedirect(redirect)) return getSafeRedirect(redirect, '/livreur');
    if (isShopRedirect(redirect)) return getSafeRedirect(redirect, '/produits');
    return '/livreur';
  }
  const fallback = isCheckoutRedirect(redirect) ? '/commande' : '/compte';
  return getSafeRedirectForCustomer(redirect, fallback);
}
