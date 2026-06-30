import type { AccountType } from '@/shared/lib/account-type';

export type AuthSessionUser = {
  id?: string;
  name: string;
  email: string;
  role: 'admin' | 'customer' | 'courier';
  accountType: AccountType;
  accountTypeLabel: string;
  avatarUrl?: string | null;
  telephone?: string | null;
  derniereAdresse?: string | null;
  derniereVille?: string | null;
};

export const AUTH_ME_CACHE_KEY = 'lovepiment_auth_me_v4';

export function mapMeResponseToSessionUser(
  raw: Record<string, unknown> | null | undefined,
): AuthSessionUser | null {
  if (!raw?.accountTypeLabel || typeof raw.name !== 'string' || typeof raw.email !== 'string') {
    return null;
  }

  return {
    id: typeof raw.id === 'string' ? raw.id : undefined,
    name: raw.name,
    email: raw.email,
    role: raw.role as AuthSessionUser['role'],
    accountType: (raw.accountType as AccountType) ?? 'client',
    accountTypeLabel: String(raw.accountTypeLabel),
    avatarUrl: (raw.avatarUrl as string | null | undefined) ?? null,
    telephone: (raw.telephone as string | null | undefined) ?? null,
    derniereAdresse: (raw.derniereAdresse as string | null | undefined) ?? null,
    derniereVille: (raw.derniereVille as string | null | undefined) ?? null,
  };
}

export function writeAuthMeCache(user: AuthSessionUser | null): void {
  try {
    if (!user) {
      sessionStorage.removeItem(AUTH_ME_CACHE_KEY);
      return;
    }
    sessionStorage.setItem(
      AUTH_ME_CACHE_KEY,
      JSON.stringify({ user, ts: Date.now() }),
    );
  } catch {
    /* ignore */
  }
}

export function readAuthMeCache(): AuthSessionUser | null {
  try {
    const raw = sessionStorage.getItem(AUTH_ME_CACHE_KEY);
    if (!raw) return null;
    const { user } = JSON.parse(raw) as { user: AuthSessionUser | null; ts: number };
    return user?.accountTypeLabel ? user : null;
  } catch {
    return null;
  }
}

export function clearAuthMeCache(): void {
  writeAuthMeCache(null);
}

/** Après connexion / inscription : enregistre le profil pour affichage immédiat. */
export function seedAuthSessionAfterLogin(user: unknown): void {
  const mapped = mapMeResponseToSessionUser(user as Record<string, unknown>);
  if (mapped) writeAuthMeCache(mapped);
}
