'use client';

import { Mic, MicOff } from 'lucide-react';
import { cn } from '@/lib/utils';

type VoiceSearchMicButtonProps = {
  isListening: boolean;
  onToggle: () => void;
  disabled?: boolean;
  className?: string;
  size?: 'sm' | 'md';
};

export function VoiceSearchMicButton({
  isListening,
  onToggle,
  disabled,
  className,
  size = 'md',
}: VoiceSearchMicButtonProps) {
  const btnClass = size === 'sm' ? 'h-6 w-6' : 'h-7 w-7';
  const iconClass = size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5';

  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      className={cn(
        'flex items-center justify-center rounded-full transition',
        btnClass,
        isListening
          ? 'bg-red-500 text-white animate-pulse'
          : 'text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700',
        disabled && 'pointer-events-none opacity-50',
        className,
      )}
      aria-label={isListening ? 'Arrêter la dictée vocale' : 'Recherche vocale'}
      title={isListening ? 'Arrêter' : 'Dicter votre recherche'}
    >
      {isListening ? <MicOff className={iconClass} /> : <Mic className={iconClass} />}
    </button>
  );
}
