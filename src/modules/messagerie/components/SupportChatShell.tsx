'use client';

import { useCallback, useState } from 'react';
import { useRunAfterMount } from '@/shared/hooks/useRunAfterMount';
import { Loader2 } from 'lucide-react';
import { ChatPanel } from './ChatPanel';
import { SUPPORT_LABEL } from '../lib/support';
import { chatSessionHeaders, syncChatSessionCookie } from '@/shared/lib/chat-session';

type Props = {
  className?: string;
  fullHeight?: boolean;
};

export function SupportChatShell({ className = '', fullHeight = true }: Props) {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const init = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/messagerie/support', { headers: chatSessionHeaders() });
      if (!res.ok) {
        setError('Impossible de démarrer la conversation.');
        return;
      }
      const data = await res.json();
      setConversationId(data.conversation?.id ?? null);
    } catch {
      setError('Erreur réseau.');
    } finally {
      setLoading(false);
    }
  }, []);

  useRunAfterMount(() => {
    syncChatSessionCookie();
    void init();
  }, [init]);

  if (loading) {
    return (
      <div className={`flex items-center justify-center py-16 ${className}`}>
        <Loader2 className="h-6 w-6 animate-spin text-olive" />
      </div>
    );
  }

  if (error || !conversationId) {
    return (
      <div className={`text-center py-12 px-4 ${className}`}>
        <p className="text-sm text-zinc-500">{error ?? 'Conversation indisponible.'}</p>
        <button
          type="button"
          onClick={init}
          className="mt-3 text-sm font-semibold text-olive hover:underline"
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className={`flex flex-col ${fullHeight ? 'h-full min-h-0' : ''} ${className}`}>
      <ChatPanel
        mode="client"
        conversationId={conversationId}
        title={SUPPORT_LABEL}
        subtitle="Messages et appels sur le site"
        className="flex-1 min-h-0"
      />
    </div>
  );
}
