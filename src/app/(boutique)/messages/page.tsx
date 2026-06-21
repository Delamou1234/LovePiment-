'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { ChevronRight, MessageCircle } from 'lucide-react';
import { SupportChatShell } from '@/modules/messagerie/components/SupportChatShell';
import { syncChatSessionCookie } from '@/shared/lib/chat-session';

export default function MessagesPage() {
  useEffect(() => {
    syncChatSessionCookie();
  }, []);

  return (
    <div className="container-kabishop py-6 md:py-8 animate-fadeIn flex flex-col min-h-[calc(100vh-8rem)]">
      <div className="flex items-center gap-1.5 text-xs text-zinc-500 mb-4 shrink-0">
        <Link href="/" className="hover:text-zinc-900 transition font-medium">
          Accueil
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-zinc-800 font-bold">Messagerie</span>
      </div>

      <div className="mb-4 flex items-center gap-3 shrink-0">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-olive/10 text-olive">
          <MessageCircle className="h-5 w-5" />
        </div>
        <div>
          <h1 className="font-serif text-xl font-bold text-zinc-900">Messages</h1>
          <p className="text-sm text-zinc-500">Texte, photos et messages vocaux</p>
        </div>
      </div>

      <div className="flex-1 min-h-[560px] rounded-2xl border border-beige-border bg-white shadow-sm overflow-hidden flex flex-col">
        <SupportChatShell fullHeight />
      </div>

      <p className="mt-4 shrink-0 text-center text-xs text-zinc-400">
        Connecté ?{' '}
        <Link href="/compte/messages" className="font-semibold text-olive hover:underline">
          Ouvrir dans mon compte
        </Link>
      </p>
    </div>
  );
}
