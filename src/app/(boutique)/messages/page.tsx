'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronRight, MessageCircle } from 'lucide-react';
import { ChatPanel } from '@/modules/messagerie/components/ChatPanel';
import { ConversationList } from '@/modules/messagerie/components/ConversationList';
import type { ConversationResume } from '@/modules/messagerie/types';
import { chatSessionHeaders, syncChatSessionCookie } from '@/shared/lib/chat-session';

export default function MessagesPage() {
  const [ready, setReady] = useState(false);
  const [conversations, setConversations] = useState<ConversationResume[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [nom, setNom] = useState('');
  const [telephone, setTelephone] = useState('');
  const [messageInitial, setMessageInitial] = useState('');

  const load = useCallback(async () => {
    const res = await fetch('/api/messagerie/conversations', { headers: chatSessionHeaders() });
    if (res.ok) {
      const data = await res.json();
      setConversations(data.conversations ?? []);
    }
  }, []);

  useEffect(() => {
    syncChatSessionCookie();
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    load();
  }, [ready, load]);

  const createConversation = async () => {
    if (!nom.trim()) return;
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
      setShowNew(false);
      await load();
    }
  };

  return (
    <div className="container-kabishop py-8 animate-fadeIn">
      <div className="flex items-center gap-1.5 text-xs text-zinc-500 mb-6">
        <Link href="/" className="hover:text-zinc-900 transition font-medium">
          Accueil
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-zinc-800 font-bold">Messagerie</span>
      </div>

      <div className="rounded-2xl border border-[#ebe4d8] bg-white shadow-sm overflow-hidden min-h-[520px] flex flex-col lg:flex-row">
        <aside className="lg:w-80 border-b lg:border-b-0 lg:border-r border-zinc-100 flex flex-col">
          <div className="p-4 border-b border-zinc-100">
            <div className="flex items-center gap-2 mb-3">
              <MessageCircle className="h-5 w-5 text-[#4a5240]" />
              <h1 className="font-serif text-lg font-bold text-zinc-900">Mes conversations</h1>
            </div>
            <button
              type="button"
              onClick={() => setShowNew(true)}
              className="btn-primary w-full rounded-full py-2.5 text-sm font-bold"
            >
              Nouvelle conversation
            </button>
          </div>

          {showNew ? (
            <div className="p-4 space-y-3 border-b border-zinc-100">
              <input
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                placeholder="Votre nom *"
                className="input-kabishop w-full"
              />
              <input
                value={telephone}
                onChange={(e) => setTelephone(e.target.value)}
                placeholder="Téléphone"
                className="input-kabishop w-full"
              />
              <textarea
                value={messageInitial}
                onChange={(e) => setMessageInitial(e.target.value)}
                placeholder="Message initial…"
                rows={2}
                className="input-kabishop w-full resize-none"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={createConversation}
                  className="btn-primary flex-1 rounded-full py-2 text-sm font-bold"
                >
                  Envoyer
                </button>
                <button
                  type="button"
                  onClick={() => setShowNew(false)}
                  className="text-sm text-zinc-500 px-2"
                >
                  Annuler
                </button>
              </div>
            </div>
          ) : null}

          <div className="flex-1 overflow-y-auto max-h-[400px] lg:max-h-none">
            <ConversationList
              conversations={conversations}
              activeId={activeId ?? undefined}
              unreadKey="nonLuClient"
              onSelect={setActiveId}
            />
          </div>
        </aside>

        <div className="flex-1 min-h-[400px] lg:min-h-[520px] flex flex-col">
          {activeId ? (
            <ChatPanel mode="client" conversationId={activeId} className="flex-1 min-h-0" />
          ) : (
            <div className="flex flex-1 items-center justify-center text-sm text-zinc-400 p-8 text-center">
              Sélectionnez une conversation ou démarrez-en une nouvelle pour contacter le vendeur.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
