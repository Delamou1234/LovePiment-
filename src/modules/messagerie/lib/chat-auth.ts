import type { NextRequest } from 'next/server';
import {
  CHAT_SESSION_COOKIE,
  CHAT_SESSION_HEADER,
} from '@/shared/lib/chat-session.constants';

export { requireAdmin } from '@/modules/admin/lib/require-admin';

export function getClientSessionFromRequest(request: NextRequest): string | null {
  return (
    request.headers.get(CHAT_SESSION_HEADER) ??
    request.nextUrl.searchParams.get('session') ??
    request.cookies.get(CHAT_SESSION_COOKIE)?.value ??
    null
  );
}
