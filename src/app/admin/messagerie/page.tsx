'use client';

import { useCallback, useEffect, useState } from 'react';
import { Loader2, MessageSquare, RefreshCw } from 'lucide-react';
import { ChatPanel } from '@/modules/messagerie/components/ChatPanel';
import { ConversationList } from '@/modules/messagerie/components/ConversationList';
import type { ConversationResume } from '@/modules/messagerie/types';
import { Button } from '@/components/ui/button';

export default function AdminMessageriePage() {
  const [conversations, setConversations] = useState<ConversationResume[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/messagerie/conversations');
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 15_000);
    return () => clearInterval(interval);
  }, [load]);

  const active = conversations.find((c) => c.id === activeId);
  const totalUnread = conversations.reduce((n, c) => n + c.nonLuVendeur, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 flex items-center gap-2">
            <MessageSquare className="h-6 w-6" />
            Messagerie
            {totalUnread > 0 && (
              <span className="rounded-full bg-red-500 text-white text-xs font-bold px-2 py-0.5">
                {totalUnread}
              </span>
            )}
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Conversations clients en temps réel — images, documents et messages vocaux.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden min-h-[560px] flex flex-col lg:flex-row">
        <aside className="lg:w-80 border-b lg:border-b-0 lg:border-r border-zinc-100">
          {loading && conversations.length === 0 ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
            </div>
          ) : (
            <ConversationList
              conversations={conversations}
              activeId={activeId ?? undefined}
              unreadKey="nonLuVendeur"
              onSelect={setActiveId}
            />
          )}
        </aside>

        <div className="flex-1 min-h-[480px] flex flex-col">
          {activeId && active ? (
            <ChatPanel
              mode="admin"
              conversationId={activeId}
              title={active.clientNom}
              subtitle={active.clientTelephone ?? undefined}
              className="flex-1 min-h-0"
            />
          ) : (
            <div className="flex flex-1 items-center justify-center text-sm text-zinc-400 p-8">
              Sélectionnez une conversation pour répondre au client.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
