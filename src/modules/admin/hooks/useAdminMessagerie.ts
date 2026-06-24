'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRunAfterMount } from '@/shared/hooks/useRunAfterMount';
import type { ConversationResume } from '@/modules/messagerie/types';

const POLL_MS = 30_000;

export function useAdminMessagerie(enabled = true) {
  const [conversations, setConversations] = useState<ConversationResume[]>([]);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(true);
  const activeRef = useRef(true);

  const refresh = useCallback(async () => {
    if (!enabled || !authorized || !activeRef.current) return;
    try {
      const res = await fetch('/api/admin/messagerie/conversations');
      if (res.status === 401) {
        setAuthorized(false);
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, [authorized, enabled]);

  useRunAfterMount(() => {
    activeRef.current = true;

    if (!enabled || !authorized) {
      setLoading(false);
      return;
    }

    void refresh();
  }, [authorized, enabled, refresh]);

  useEffect(() => {
    if (!enabled || !authorized) return;

    const interval = setInterval(refresh, POLL_MS);

    const onVisibility = () => {
      activeRef.current = !document.hidden;
      if (activeRef.current) void refresh();
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      activeRef.current = false;
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [authorized, enabled, refresh]);

  const totalUnread = useMemo(
    () => conversations.reduce((n, c) => n + c.nonLuVendeur, 0),
    [conversations],
  );

  const sortedConversations = useMemo(
    () =>
      [...conversations].sort((a, b) => {
        if (a.nonLuVendeur !== b.nonLuVendeur) return b.nonLuVendeur - a.nonLuVendeur;
        const aTime = a.dernierMessageAt ? new Date(a.dernierMessageAt).getTime() : 0;
        const bTime = b.dernierMessageAt ? new Date(b.dernierMessageAt).getTime() : 0;
        return bTime - aTime;
      }),
    [conversations],
  );

  const unreadConversations = useMemo(
    () => sortedConversations.filter((c) => c.nonLuVendeur > 0),
    [sortedConversations],
  );

  return {
    conversations: sortedConversations,
    unreadConversations,
    totalUnread,
    loading,
    refresh,
  };
}
