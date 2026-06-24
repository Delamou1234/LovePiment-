'use client';

import { useRunAfterMount } from '@/shared/hooks/useRunAfterMount';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, ImagePlus, Loader2 } from 'lucide-react';
import type { ConversationDetailDto } from '../types';
import { ChatInput } from './ChatInput';
import { ChatMessageList } from './ChatMessageList';
import { OnlineIndicator } from './OnlineIndicator';
import { VoiceCallControls } from './VoiceCallControls';
import { useFeatureFlags } from '@/shared/hooks/useFeatureFlags';
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
  const { appelsActifs } = useFeatureFlags();
  const [conversation, setConversation] = useState<ConversationDetailDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const participantId = mode === 'admin' ? 'vendeur-admin' : getOrCreateChatSessionId();

  const headers = useCallback((): HeadersInit => {
    if (mode === 'client') {
      return { 'Content-Type': 'application/json', ...chatSessionHeaders() };
    }
    return { 'Content-Type': 'application/json' };
  }, [mode]);

  const load = useCallback(async () => {
    const res = await fetch(apiBase(mode, conversationId), { headers: headers() });
    if (res.ok) {
      const data = await res.json();
      setConversation(data.conversation);
    }
    setLoading(false);
  }, [conversationId, headers, mode]);

  useRunAfterMount(() => void load(), [load]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation?.messages.length, uploading]);

  useEffect(() => {
    const session =
      mode === 'client' ? `?session=${encodeURIComponent(getOrCreateChatSessionId())}` : '';
    const streamUrl = `${apiBase(mode, conversationId)}/stream${session}`;
    const es = new EventSource(streamUrl);

    es.onopen = () => setConnected(true);
    es.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === 'update') {
          if (payload.conversation) {
            setConversation(payload.conversation);
          } else if (payload.updatedAt) {
            void load();
          }
        }
      } catch {
        /* ignore */
      }
    };
    es.onerror = () => setConnected(false);

    return () => es.close();
  }, [conversationId, mode, load]);

  useEffect(() => {
    const ping = async (isTyping?: boolean) => {
      try {
        await fetch(`${apiBase(mode, conversationId)}/presence`, {
          method: 'POST',
          headers: headers(),
          body: JSON.stringify({ participantId, isTyping }),
        });
      } catch {
        /* serveur indisponible ou onglet en arrière-plan */
      }
    };

    ping();
    const interval = setInterval(() => ping(), 45_000);
    return () => clearInterval(interval);
  }, [conversationId, headers, mode, participantId]);

  const sendMessage = async (body: Record<string, unknown>) => {
    const res = await fetch(`${apiBase(mode, conversationId)}/messages`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error('send_failed');
    await fetch(`${apiBase(mode, conversationId)}/read`, {
      method: 'PATCH',
      headers: headers(),
    });
    await load();
  };

  const onSendText = async (text: string) => {
    await sendMessage({ type: 'TEXT', contenu: text });
  };

  const onUpload = async (file: File, dureeMs?: number, caption?: string) => {
    setUploading(true);
    try {
      const form = new FormData();
      form.append('conversationId', conversationId);
      form.append('file', file);

      const uploadHeaders: HeadersInit = mode === 'client' ? chatSessionHeaders() : {};

      const uploadRes = await fetch('/api/messagerie/upload', {
        method: 'POST',
        headers: uploadHeaders,
        body: form,
      });

      if (!uploadRes.ok) throw new Error('upload_failed');
      const uploaded = await uploadRes.json();

      await sendMessage({
        type: uploaded.type,
        contenu: caption,
        fichierUrl: uploaded.url,
        fichierNom: uploaded.nom,
        fichierTaille: uploaded.taille,
        dureeMs,
      });
    } finally {
      setUploading(false);
    }
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
        <Loader2 className="h-6 w-6 animate-spin text-olive" />
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
    <div
      className={`flex flex-col h-full min-h-0 bg-[#e8e4dc] ${className}`}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files?.[0];
        if (file?.type.startsWith('image/')) void onUpload(file);
      }}
    >
      <div className="flex items-center gap-3 border-b border-beige-border/80 bg-white px-4 py-3 shrink-0 relative shadow-sm">
        {onBack && (
          <button type="button" onClick={onBack} className="rounded-full p-1.5 hover:bg-cream lg:hidden">
            <ArrowLeft className="h-4 w-4" />
          </button>
        )}
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-olive/10 text-sm font-bold text-olive">
          {mode === 'client' ? 'K' : conversation.clientNom.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-zinc-900 truncate">
            {title ?? conversation.clientNom}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <OnlineIndicator enLigne={enLigne} size="sm" />
            <span className="text-[11px] text-zinc-500">
              {enLigne ? 'En ligne' : 'Hors ligne'}
              {connected && ' · connecté'}
            </span>
            {subtitle && (
              <span className="hidden sm:inline text-[10px] text-zinc-400 truncate">· {subtitle}</span>
            )}
          </div>
        </div>
        {appelsActifs && (
          <VoiceCallControls
            conversationId={conversationId}
            mode={mode}
            peerLabel={mode === 'client' ? 'Support Love Piment&' : conversation.clientNom}
          />
        )}
      </div>

      <div className="relative flex-1 min-h-0 overflow-y-auto">
        {dragOver && (
          <div className="absolute inset-3 z-10 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-olive bg-olive/10 backdrop-blur-sm">
            <ImagePlus className="h-10 w-10 text-olive mb-2" />
            <p className="text-sm font-semibold text-olive">Déposez votre image ici</p>
          </div>
        )}

        {uploading && (
          <div className="sticky top-0 z-10 flex items-center justify-center gap-2 bg-olive/90 px-3 py-2 text-xs font-medium text-white">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Envoi en cours…
          </div>
        )}

        <ChatMessageList
          messages={conversation.messages}
          mode={mode}
          isTyping={isTyping}
          typingLabel={
            mode === 'client' ? "L'équipe Love Piment& écrit…" : `${conversation.clientNom} écrit…`
          }
          bottomRef={bottomRef}
        />
      </div>

      <ChatInput onSendText={onSendText} onUpload={onUpload} onTyping={onTyping} />
    </div>
  );
}
