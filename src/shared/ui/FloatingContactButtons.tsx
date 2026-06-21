'use client';

import Link from 'next/link';
import { MessageCircle, Sparkles } from 'lucide-react';
import { genererMessageGeneral } from '@/modules/messagerie/providers/whatsapp.provider';

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
  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '224620000000';
  const msg = genererMessageGeneral();
  const numNettoye = whatsappNumber.replace(/[\s+\-()]/g, '');
  const href = `https://wa.me/${numNettoye}?text=${encodeURIComponent(msg)}`;

  return (
    <div
      className="fixed bottom-5 right-5 z-40 flex flex-col items-center gap-3"
      aria-label="Actions rapides"
    >
      {onOpenAssistant && (
        <button
          type="button"
          onClick={onOpenAssistant}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-900 text-white shadow-lg hover:bg-zinc-800 transition hover:scale-105"
          aria-label="Assistant IA KabiShop"
          title="Assistant shopping IA"
        >
          <Sparkles className="h-5 w-5" />
        </button>
      )}

      <button
        type="button"
        onClick={onOpenChat}
        className="relative flex h-12 w-12 items-center justify-center rounded-full bg-[#4a5240] text-white shadow-lg hover:bg-[#3d4534] transition hover:scale-105"
        aria-label="Messagerie instantanée"
      >
        <MessageCircle className="h-5 w-5" />
        {chatUnread > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold px-1">
            {chatUnread}
          </span>
        )}
      </button>

      <Link
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Contacter KabiShop sur WhatsApp"
        className="flex h-12 w-12 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg hover:bg-[#20ba5a] transition hover:scale-105"
      >
        <MessageCircle className="h-5 w-5" fill="white" />
      </Link>
    </div>
  );
}
