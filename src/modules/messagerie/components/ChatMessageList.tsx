'use client';

import type { MessageDto } from '../types';
import { ChatMessageBubble } from './ChatMessageBubble';
import { dateKey, formatDateSeparator } from '../lib/format';

type Props = {
  messages: MessageDto[];
  mode: 'client' | 'admin';
  isTyping?: boolean;
  typingLabel?: string;
  bottomRef: React.RefObject<HTMLDivElement | null>;
};

export function ChatMessageList({
  messages,
  mode,
  isTyping,
  typingLabel,
  bottomRef,
}: Props) {
  const myRole = mode === 'client' ? 'CLIENT' : 'VENDEUR';

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-olive/10 text-olive">
          <span className="text-2xl">💬</span>
        </div>
        <p className="font-semibold text-zinc-800">Démarrez la conversation</p>
        <p className="mt-1 max-w-xs text-sm text-zinc-500">
          Envoyez un message, une photo ou un vocal. L&apos;équipe KabiShop vous répond ici.
        </p>
      </div>
    );
  }

  let lastDateKey = '';

  return (
    <div className="flex flex-col gap-1 px-3 py-4 sm:px-4">
      {messages.map((msg) => {
        const key = dateKey(msg.createdAt);
        const showSeparator = key !== lastDateKey;
        lastDateKey = key;

        return (
          <div key={msg.id}>
            {showSeparator && (
              <div className="my-4 flex justify-center">
                <span className="rounded-full bg-white/80 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-500 shadow-sm ring-1 ring-black/[0.04]">
                  {formatDateSeparator(msg.createdAt)}
                </span>
              </div>
            )}
            <div className={`flex mb-2 ${msg.senderRole === myRole ? 'justify-end' : 'justify-start'}`}>
              <ChatMessageBubble message={msg} isMine={msg.senderRole === myRole} />
            </div>
          </div>
        );
      })}

      {isTyping && (
        <div className="flex justify-start mb-2">
          <div className="rounded-2xl rounded-bl-md bg-white px-4 py-3 shadow-sm ring-1 ring-black/[0.04]">
            <div className="flex gap-1">
              <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-400 [animation-delay:0ms]" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-400 [animation-delay:150ms]" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-400 [animation-delay:300ms]" />
            </div>
            {typingLabel && (
              <p className="mt-1 text-[10px] text-zinc-400">{typingLabel}</p>
            )}
          </div>
        </div>
      )}

      <div ref={bottomRef} className="h-px shrink-0" />
    </div>
  );
}
