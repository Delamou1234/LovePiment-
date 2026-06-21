'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { MessageCircle, X } from 'lucide-react';
import { ChatPanel } from './ChatPanel';
import { ConversationList } from './ConversationList';
import type { ConversationResume } from '../types';
import { chatSessionHeaders, syncChatSessionCookie } from '@/shared/lib/chat-session';
import { FloatingContactButtons } from '@/shared/ui/FloatingContactButtons';

interface ChatWidgetProps {
  onOpenAssistant?: () => void;
}

export function ChatWidget({ onOpenAssistant }: ChatWidgetProps = {}) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<'list' | 'chat' | 'new'>('list');
  const [conversations, setConversations] = useState<ConversationResume[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [nom, setNom] = useState('');
  const [telephone, setTelephone] = useState('');
  const [messageInitial, setMessageInitial] = useState('');
  const [creating, setCreating] = useState(false);

  const loadConversations = useCallback(async () => {
    const res = await fetch('/api/messagerie/conversations', {
      headers: chatSessionHeaders(),
    });
    if (res.ok) {
      const data = await res.json();
      setConversations(data.conversations ?? []);
    }
  }, []);

  useEffect(() => {
    syncChatSessionCookie();
  }, []);

  useEffect(() => {
    if (open) loadConversations();
  }, [open, loadConversations]);

  const totalUnread = conversations.reduce((n, c) => n + c.nonLuClient, 0);

  const startNew = async () => {
    if (!nom.trim() || creating) return;
    setCreating(true);
    try {
      const res = await fetch('/api/messagerie/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...chatSessionHeaders() },
        body: JSON.stringify({
          clientNom: nom.trim(),
          clientTelephone: telephone.trim() || undefined,
          messageInitial: messageInitial.trim() || undefined,
          sujet: 'Contact boutique',
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setActiveId(data.conversation.id);
        setView('chat');
        await loadConversations();
        setNom('');
        setTelephone('');
        setMessageInitial('');
      }
    } finally {
      setCreating(false);
    }
  };

  return (
    <>
      <FloatingContactButtons
        onOpenChat={() => setOpen(true)}
        onOpenAssistant={onOpenAssistant}
        chatUnread={totalUnread}
      />

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-end p-4 sm:p-6 pointer-events-none">
          <div
            className="pointer-events-auto w-full max-w-md h-[min(560px,calc(100vh-6rem))] rounded-2xl border border-[#ebe4d8] bg-white shadow-2xl flex flex-col overflow-hidden animate-fadeIn"
            role="dialog"
            aria-label="Chat KabiShop"
          >
            <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3 shrink-0">
              <div>
                <p className="font-serif font-bold text-zinc-900">Messagerie</p>
                <p className="text-[10px] text-zinc-400">Chat en direct avec KabiShop</p>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href="/messages"
                  className="text-[10px] font-medium text-[#4a5240] hover:underline"
                  onClick={() => setOpen(false)}
                >
                  Plein écran
                </Link>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-full p-1.5 hover:bg-zinc-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {view === 'chat' && activeId ? (
              <ChatPanel
                mode="client"
                conversationId={activeId}
                onBack={() => {
                  setView('list');
                  setActiveId(null);
                  loadConversations();
                }}
                className="flex-1 min-h-0"
              />
            ) : view === 'new' ? (
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                <p className="text-sm font-medium text-zinc-800">Nouvelle conversation</p>
                <input
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  placeholder="Votre nom *"
                  className="input-kabishop w-full"
                />
                <input
                  value={telephone}
                  onChange={(e) => setTelephone(e.target.value)}
                  placeholder="Téléphone (optionnel)"
                  className="input-kabishop w-full"
                />
                <textarea
                  value={messageInitial}
                  onChange={(e) => setMessageInitial(e.target.value)}
                  placeholder="Votre message…"
                  rows={3}
                  className="input-kabishop w-full resize-none"
                />
                <button
                  type="button"
                  disabled={!nom.trim() || creating}
                  onClick={startNew}
                  className="btn-primary w-full rounded-full py-3 font-bold disabled:opacity-50"
                >
                  Démarrer la conversation
                </button>
                <button
                  type="button"
                  onClick={() => setView('list')}
                  className="w-full text-sm text-zinc-500 hover:text-zinc-800"
                >
                  Retour
                </button>
              </div>
            ) : (
              <div className="flex-1 flex flex-col min-h-0">
                <div className="px-4 py-2 border-b border-zinc-50">
                  <button
                    type="button"
                    onClick={() => setView('new')}
                    className="text-xs font-bold text-[#4a5240] hover:underline"
                  >
                    + Nouvelle conversation
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto min-h-0">
                  <ConversationList
                    conversations={conversations}
                    activeId={activeId ?? undefined}
                    unreadKey="nonLuClient"
                    onSelect={(id) => {
                      setActiveId(id);
                      setView('chat');
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
