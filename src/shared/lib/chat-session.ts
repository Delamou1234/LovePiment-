'use client';

import {
  CHAT_SESSION_COOKIE,
  CHAT_SESSION_HEADER,
} from '@/shared/lib/chat-session.constants';

export { CHAT_SESSION_HEADER };

const STORAGE_KEY = CHAT_SESSION_COOKIE;

export function getOrCreateChatSessionId(): string {
  if (typeof window === 'undefined') return '';
  let id = localStorage.getItem(STORAGE_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(STORAGE_KEY, id);
    document.cookie = `${CHAT_SESSION_COOKIE}=${id}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
  }
  return id;
}

export function getChatSessionId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(STORAGE_KEY);
}

export function syncChatSessionCookie(): void {
  if (typeof window === 'undefined') return;
  const id = getOrCreateChatSessionId();
  document.cookie = `${CHAT_SESSION_COOKIE}=${id}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
}

export function chatSessionHeaders(sessionId?: string): HeadersInit {
  const id = sessionId ?? getOrCreateChatSessionId();
  return { [CHAT_SESSION_HEADER]: id };
}
