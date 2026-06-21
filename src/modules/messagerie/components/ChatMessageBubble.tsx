'use client';

import { Check, CheckCheck, FileText, Mic } from 'lucide-react';
import type { MessageDto } from '../types';

type ChatMessageBubbleProps = {
  message: MessageDto;
  isMine: boolean;
};

function formatTime(date: Date | string) {
  return new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

function formatDuration(ms: number) {
  const sec = Math.round(ms / 1000);
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function ChatMessageBubble({ message, isMine }: ChatMessageBubbleProps) {
  const read = Boolean(message.luLe);
  const align = isMine ? 'items-end' : 'items-start';
  const bubble = isMine
    ? 'bg-[#4a5240] text-white rounded-2xl rounded-br-md'
    : 'bg-zinc-100 text-zinc-900 rounded-2xl rounded-bl-md';

  return (
    <div className={`flex flex-col gap-1 max-w-[85%] ${align}`}>
      <div className={`px-3.5 py-2.5 text-sm ${bubble}`}>
        {message.type === 'TEXT' && (
          <p className="whitespace-pre-wrap break-words">{message.contenu}</p>
        )}

        {message.type === 'IMAGE' && message.fichierUrl && (
          <a href={message.fichierUrl} target="_blank" rel="noopener noreferrer">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={message.fichierUrl}
              alt={message.fichierNom ?? 'Image'}
              className="max-h-48 rounded-lg object-cover"
            />
          </a>
        )}

        {message.type === 'DOCUMENT' && message.fichierUrl && (
          <a
            href={message.fichierUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 underline-offset-2 hover:underline"
          >
            <FileText className="h-4 w-4 shrink-0" />
            <span className="truncate">{message.fichierNom ?? 'Document'}</span>
          </a>
        )}

        {message.type === 'VOICE' && message.fichierUrl && (
          <div className="flex items-center gap-2 min-w-[200px]">
            <Mic className="h-4 w-4 shrink-0 opacity-80" />
            <audio controls src={message.fichierUrl} className="h-8 w-full max-w-[220px]" />
            {message.dureeMs ? (
              <span className="text-[10px] opacity-70">{formatDuration(message.dureeMs)}</span>
            ) : null}
          </div>
        )}

        {message.contenu && message.type !== 'TEXT' && (
          <p className="mt-1.5 text-xs opacity-80 whitespace-pre-wrap">{message.contenu}</p>
        )}
      </div>

      <div className={`flex items-center gap-1 px-1 ${isMine ? 'flex-row-reverse' : ''}`}>
        <span className="text-[10px] text-zinc-400">{formatTime(message.createdAt)}</span>
        {isMine && (
          <span className="text-zinc-400" title={read ? 'Lu' : 'Envoyé'}>
            {read ? (
              <CheckCheck className="h-3 w-3 text-sky-500" />
            ) : (
              <Check className="h-3 w-3" />
            )}
          </span>
        )}
      </div>
    </div>
  );
}
