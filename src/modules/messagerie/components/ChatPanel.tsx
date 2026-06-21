'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import type { ConversationDetailDto } from '../types';
import { ChatMessageBubble } from './ChatMessageBubble';
import { ChatInput } from './ChatInput';
import { OnlineIndicator } from './OnlineIndicator';
import { chatSessionHeaders, getOrCreateChatSessionId } from '@/shared/lib/chat-session';

type ChatMode = 'client' | 'admin';

type ChatPanelProps = {
  mode: ChatMode;
  conversationId: string;
  title?: string;
  subtitle?: string;
  onBack?: () => void;
  className?: string;
};

function apiBase(mode: ChatMode, conversationId: string) {
  return mode === 'admin'
    ? `/api/admin/messagerie/conversations/${conversationId}`
    : `/api/messagerie/conversations/${conversationId}`;
}

export function ChatPanel({
  mode,
  conversationId,
  title,
  subtitle,
  onBack,
  className = '',
}: ChatPanelProps) {
  const [conversation, setConversation] = useState<ConversationDetailDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const participantId = mode === 'admin' ? 'vendeur-admin' : getOrCreateChatSessionId();

  const headers = (): HeadersInit => {
    if (mode === 'client') {
      return { 'Content-Type': 'application/json', ...chatSessionHeaders() };
    }
    return { 'Content-Type': 'application/json' };
  };

  const load = useCallback(async () => {
    const res = await fetch(apiBase(mode, conversationId), { headers: headers() });
    if (res.ok) {
      const data = await res.json();
      setConversation(data.conversation);
    }
    setLoading(false);
  }, [conversationId, mode]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation?.messages.length]);

  useEffect(() => {
    const session =
      mode === 'client' ? `?session=${encodeURIComponent(getOrCreateChatSessionId())}` : '';
    const streamUrl = `${apiBase(mode, conversationId)}/stream${session}`;
    const es = new EventSource(streamUrl);

    es.onopen = () => setConnected(true);
    es.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === 'update' && payload.conversation) {
          setConversation(payload.conversation);
        }
      } catch {
        /* ignore */
      }
    };
    es.onerror = () => setConnected(false);

    return () => es.close();
  }, [conversationId, mode]);

  useEffect(() => {
    const ping = async (isTyping?: boolean) => {
      await fetch(`${apiBase(mode, conversationId)}/presence`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ participantId, isTyping }),
      });
    };

    ping();
    const interval = setInterval(() => ping(), 20_000);
    return () => clearInterval(interval);
  }, [conversationId, mode, participantId]);

  const sendMessage = async (body: Record<string, unknown>) => {
    await fetch(`${apiBase(mode, conversationId)}/messages`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(body),
    });
    await fetch(`${apiBase(mode, conversationId)}/read`, {
      method: 'PATCH',
      headers: headers(),
    });
  };

  const onSendText = async (text: string) => {
    await sendMessage({ type: 'TEXT', contenu: text });
  };

  const onUpload = async (file: File, dureeMs?: number) => {
    const form = new FormData();
    form.append('conversationId', conversationId);
    form.append('file', file);

    const uploadHeaders: HeadersInit =
      mode === 'client' ? chatSessionHeaders() : {};

    const uploadRes = await fetch('/api/messagerie/upload', {
      method: 'POST',
      headers: uploadHeaders,
      body: form,
    });

    if (!uploadRes.ok) return;
    const uploaded = await uploadRes.json();

    await sendMessage({
      type: uploaded.type,
      fichierUrl: uploaded.url,
      fichierNom: uploaded.nom,
      fichierTaille: uploaded.taille,
      dureeMs,
    });
  };

  const onTyping = (typing: boolean) => {
    fetch(`${apiBase(mode, conversationId)}/presence`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ participantId, isTyping: typing }),
    }).catch(() => {});
  };

  const otherRole = mode === 'client' ? 'VENDEUR' : 'CLIENT';
  const otherPresence = conversation?.presence.find((p) => p.role === otherRole);
  const isTyping = otherPresence?.isTyping;
  const enLigne = otherPresence?.enLigne ?? false;

  if (loading) {
    return (
      <div className={`flex items-center justify-center py-16 ${className}`}>
        <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (!conversation) {
    return (
      <p className={`text-center text-sm text-zinc-500 py-12 ${className}`}>
        Conversation introuvable.
      </p>
    );
  }

  return (
    <div className={`flex flex-col h-full min-h-0 bg-white ${className}`}>
      <div className="flex items-center gap-3 border-b border-zinc-100 px-4 py-3 shrink-0">
        {onBack && (
          <button type="button" onClick={onBack} className="rounded-full p-1.5 hover:bg-zinc-100">
            <ArrowLeft className="h-4 w-4" />
          </button>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-zinc-900 truncate">
            {title ?? conversation.clientNom}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <OnlineIndicator enLigne={enLigne} size="sm" />
            {connected && (
              <span className="text-[10px] text-emerald-600">· Temps réel</span>
            )}
            {subtitle && (
              <span className="text-[10px] text-zinc-400 truncate">{subtitle}</span>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 min-h-0">
        {conversation.messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.senderRole === (mode === 'client' ? 'CLIENT' : 'VENDEUR') ? 'justify-end' : 'justify-start'}`}
          >
            <ChatMessageBubble
              message={msg}
              isMine={msg.senderRole === (mode === 'client' ? 'CLIENT' : 'VENDEUR')}
            />
          </div>
        ))}
        {isTyping && (
          <p className="text-xs text-zinc-400 italic px-1">
            {mode === 'client' ? 'Le vendeur' : 'Le client'} est en train d&apos;écrire…
          </p>
        )}
        <div ref={bottomRef} />
      </div>

      <ChatInput onSendText={onSendText} onUpload={onUpload} onTyping={onTyping} />
    </div>
  );
}
