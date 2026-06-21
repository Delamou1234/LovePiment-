import type { SessionUser } from './session';

export function isValidCustomerSession(
  session: SessionUser | null | undefined,
): session is SessionUser & { id: string } {
  return Boolean(session?.role === 'customer' && session.id);
}
