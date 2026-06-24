'use client';

import type { ConversationResume } from '../types';

type ConversationListProps = {
  conversations: ConversationResume[];
  activeId?: string;
  onSelect: (id: string) => void;
  unreadKey: 'nonLuClient' | 'nonLuVendeur';
};

function formatRelative(date: Date | string | null) {
  if (!date) return '';
  const d = new Date(date);
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

export function ConversationList({
  conversations,
  activeId,
  onSelect,
  unreadKey,
}: ConversationListProps) {
  if (conversations.length === 0) {
    return (
      <p className="text-sm text-zinc-500 text-center py-8 px-4">
        Aucune conversation pour le moment.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-zinc-100">
      {conversations.map((conv) => {
        const unread = conv[unreadKey];
        const active = conv.id === activeId;
        return (
          <li key={conv.id}>
            <button
              type="button"
              onClick={() => onSelect(conv.id)}
              className={`w-full text-left px-4 py-3 hover:bg-zinc-50 transition ${
                active ? 'bg-[#FFF0F3] border-l-2 border-[#9B1B2E]' : ''
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="font-medium text-sm text-zinc-900 truncate">{conv.clientNom}</p>
                {unread > 0 && (
                  <span className="shrink-0 rounded-full bg-[#9B1B2E] text-white text-[10px] font-bold px-1.5 py-0.5 min-w-[18px] text-center">
                    {unread}
                  </span>
                )}
              </div>
              {conv.sujet && (
                <p className="text-xs text-zinc-500 truncate mt-0.5">{conv.sujet}</p>
              )}
              <p className="text-xs text-zinc-400 truncate mt-1">
                {conv.dernierMessage ?? 'Nouvelle conversation'}
              </p>
              <p className="text-[10px] text-zinc-300 mt-1">
                {formatRelative(conv.dernierMessageAt)}
              </p>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
