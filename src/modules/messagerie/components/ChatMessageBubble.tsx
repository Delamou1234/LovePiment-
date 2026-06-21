'use client';

import { Check, CheckCheck, Download, FileText } from 'lucide-react';
import type { MessageDto } from '../types';
import { formatMessageTime } from '../lib/format';
import { VoiceMessagePlayer } from './VoiceMessagePlayer';
import { ImageMessagePreview } from './ImageMessagePreview';

type ChatMessageBubbleProps = {
  message: MessageDto;
  isMine: boolean;
};

function formatFileSize(bytes?: number | null) {
  if (!bytes) return null;
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

export function ChatMessageBubble({ message, isMine }: ChatMessageBubbleProps) {
  const read = Boolean(message.luLe);

  const bubble = isMine
    ? 'bg-olive text-white rounded-2xl rounded-br-sm shadow-sm'
    : 'bg-white text-zinc-900 rounded-2xl rounded-bl-sm shadow-sm ring-1 ring-black/[0.04]';

  const mediaBubble =
    message.type === 'IMAGE'
      ? isMine
        ? 'rounded-2xl rounded-br-sm overflow-hidden shadow-sm'
        : 'rounded-2xl rounded-bl-sm overflow-hidden shadow-sm ring-1 ring-black/[0.04]'
      : bubble;

  return (
    <div className={`flex flex-col gap-1 max-w-[min(320px,85%)] ${isMine ? 'items-end' : 'items-start'}`}>
      <div className={`${message.type === 'IMAGE' ? mediaBubble : bubble} ${message.type !== 'IMAGE' ? 'px-3 py-2' : ''}`}>
        {message.type === 'TEXT' && (
          <p className="whitespace-pre-wrap break-words text-[15px] leading-relaxed">{message.contenu}</p>
        )}

        {message.type === 'IMAGE' && message.fichierUrl && (
          <ImageMessagePreview
            src={message.fichierUrl}
            alt={message.fichierNom ?? 'Image'}
            isMine={isMine}
          />
        )}

        {message.type === 'DOCUMENT' && message.fichierUrl && (
          <a
            href={message.fichierUrl}
            target="_blank"
            rel="noopener noreferrer"
            download={message.fichierNom ?? undefined}
            className={`flex items-center gap-3 rounded-xl p-2 transition ${
              isMine ? 'hover:bg-white/10' : 'hover:bg-zinc-50'
            }`}
          >
            <span
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                isMine ? 'bg-white/15' : 'bg-olive/10 text-olive'
              }`}
            >
              <FileText className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">
                {message.fichierNom ?? 'Document'}
              </span>
              {message.fichierTaille && (
                <span className={`text-[11px] ${isMine ? 'text-white/70' : 'text-zinc-500'}`}>
                  {formatFileSize(message.fichierTaille)}
                </span>
              )}
            </span>
            <Download className={`h-4 w-4 shrink-0 opacity-60 ${isMine ? 'text-white' : 'text-zinc-400'}`} />
          </a>
        )}

        {message.type === 'VOICE' && message.fichierUrl && (
          <VoiceMessagePlayer
            src={message.fichierUrl}
            durationMs={message.dureeMs}
            isMine={isMine}
          />
        )}

        {message.contenu && message.type !== 'TEXT' && (
          <p
            className={`px-3 pb-2 text-sm whitespace-pre-wrap ${
              isMine ? 'text-white/90' : 'text-zinc-700'
            } ${message.type === 'IMAGE' ? 'pt-2' : 'pt-1'}`}
          >
            {message.contenu}
          </p>
        )}
      </div>

      <div className={`flex items-center gap-1 px-1 ${isMine ? 'flex-row-reverse' : ''}`}>
        <span className="text-[10px] text-zinc-400 tabular-nums">{formatMessageTime(message.createdAt)}</span>
        {isMine && (
          <span title={read ? 'Lu' : 'Envoyé'}>
            {read ? (
              <CheckCheck className="h-3.5 w-3.5 text-sky-500" />
            ) : (
              <Check className="h-3.5 w-3.5 text-zinc-400" />
            )}
          </span>
        )}
      </div>
    </div>
  );
}
