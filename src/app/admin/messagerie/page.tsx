'use client';

import { useRunAfterMount } from '@/shared/hooks/useRunAfterMount';
import { useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, MessageSquare, RefreshCw } from 'lucide-react';
import { ChatPanel } from '@/modules/messagerie/components/ChatPanel';
import { ConversationList } from '@/modules/messagerie/components/ConversationList';
import type { ConversationResume } from '@/modules/messagerie/types';
import { ADMIN_CARD } from '@/modules/admin/components/admin-ui';

function sortConversations(list: ConversationResume[]) {
  return [...list].sort((a, b) => {
    if (a.nonLuVendeur !== b.nonLuVendeur) return b.nonLuVendeur - a.nonLuVendeur;
    const aTime = a.dernierMessageAt ? new Date(a.dernierMessageAt).getTime() : 0;
    const bTime = b.dernierMessageAt ? new Date(b.dernierMessageAt).getTime() : 0;
    return bTime - aTime;
  });
}

export default function AdminMessageriePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [conversations, setConversations] = useState<ConversationResume[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/messagerie/conversations');
      if (res.ok) {
        const data = await res.json();
        setConversations(sortConversations(data.conversations ?? []));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useRunAfterMount(() => void load(), [load]);

  useEffect(() => {
    const interval = setInterval(load, 30_000);
    return () => clearInterval(interval);
  }, [load]);

  useRunAfterMount(() => {
    if (initialized || conversations.length === 0) return;

    const fromUrl = searchParams.get('c');
    if (fromUrl && conversations.some((c) => c.id === fromUrl)) {
      setActiveId(fromUrl);
      setInitialized(true);
      return;
    }

    const firstUnread = conversations.find((c) => c.nonLuVendeur > 0);
    setActiveId(firstUnread?.id ?? conversations[0]?.id ?? null);
    setInitialized(true);
  }, [conversations, initialized, searchParams]);

  const selectConversation = (id: string) => {
    setActiveId(id);
    router.replace(`/admin/messagerie?c=${id}`, { scroll: false });
  };

  const active = conversations.find((c) => c.id === activeId);
  const totalUnread = conversations.reduce((n, c) => n + c.nonLuVendeur, 0);
  const unreadCount = conversations.filter((c) => c.nonLuVendeur > 0).length;

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-zinc-900 flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-olive" />
            Messagerie
            {totalUnread > 0 && (
              <span className="rounded-full bg-red-500 text-white text-xs font-bold px-2 py-0.5">
                {totalUnread}
              </span>
            )}
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Messages adressés à l&apos;équipe — {unreadCount} conversation
            {unreadCount > 1 ? 's' : ''} avec message{unreadCount > 1 ? 's' : ''} non lu
            {unreadCount > 1 ? 's' : ''}.
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-beige-border bg-white px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-cream disabled:opacity-60"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </button>
      </div>

      <div className={`${ADMIN_CARD} overflow-hidden min-h-[min(560px,75dvh)] flex flex-col lg:flex-row`}>
        <aside className={`lg:w-80 border-b lg:border-b-0 lg:border-r border-beige-border/60 shrink-0 ${activeId ? 'max-lg:hidden' : ''}`}>
          {loading && conversations.length === 0 ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-olive" />
            </div>
          ) : (
            <ConversationList
              conversations={conversations}
              activeId={activeId ?? undefined}
              unreadKey="nonLuVendeur"
              onSelect={selectConversation}
            />
          )}
        </aside>

        <div className={`flex-1 min-h-[min(480px,70dvh)] flex flex-col min-w-0 ${activeId ? '' : 'max-lg:hidden'}`}>
          {activeId && active ? (
            <ChatPanel
              mode="admin"
              conversationId={activeId}
              title={active.clientNom}
              subtitle={active.clientTelephone ?? active.sujet ?? undefined}
              className="flex-1 min-h-0"
              onBack={() => {
                setActiveId(null);
                router.replace('/admin/messagerie', { scroll: false });
              }}
            />
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center">
              <MessageSquare className="h-10 w-10 text-zinc-300" />
              <p className="text-sm text-zinc-500">
                Sélectionnez une conversation pour lire les messages clients.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
