'use client';

import { MessageCircle, Sparkles } from 'lucide-react';

interface FloatingContactButtonsProps {
  onOpenChat: () => void;
  onOpenAssistant?: () => void;
  chatUnread?: number;
}

export function FloatingContactButtons({
  onOpenChat,
  onOpenAssistant,
  chatUnread = 0,
}: FloatingContactButtonsProps) {
  return (
    <div
      className="safe-area-fab fixed z-40 flex flex-col items-center gap-2.5"
      aria-label="Actions rapides"
    >
      {onOpenAssistant && (
        <button
          type="button"
          onClick={onOpenAssistant}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-zinc-900 text-white shadow-lg ring-1 ring-black/10 hover:bg-zinc-800 transition hover:scale-105"
          aria-label="Assistant IA KabiShop"
          title="Assistant shopping IA"
        >
          <Sparkles className="h-4 w-4" />
        </button>
      )}

      <button
        type="button"
        onClick={onOpenChat}
        className="relative flex h-11 w-11 items-center justify-center rounded-full bg-olive text-white shadow-lg ring-1 ring-black/10 hover:bg-olive-dark transition hover:scale-105"
        aria-label="Messagerie et appels"
        title="Messagerie et appels sur le site"
      >
        <MessageCircle className="h-4 w-4" />
        {chatUnread > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold px-1">
            {chatUnread}
          </span>
        )}
      </button>
    </div>
  );
}
