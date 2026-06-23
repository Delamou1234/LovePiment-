export function urlConnexionSessionExpiree(redirectApresLogin = '/compte'): string {
  return `/connexion?redirect=${encodeURIComponent(redirectApresLogin)}&error=session_expired`;
}

/** Passe par la route API pour effacer le cookie (autorisé en Route Handler uniquement). */
export function redirectUrlApresSessionExpiree(redirectApresLogin = '/compte'): string {
  const login = urlConnexionSessionExpiree(redirectApresLogin);
  return `/api/auth/logout?redirect=${encodeURIComponent(login)}&role=customer`;
}
