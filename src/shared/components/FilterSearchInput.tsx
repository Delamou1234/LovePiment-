'use client';

import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { VoiceSearchMicButton } from '@/shared/components/VoiceSearchMicButton';
import { useVoiceSearchInput } from '@/shared/hooks/useVoiceSearchInput';

type FilterSearchInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  wrapClassName?: string;
  iconClassName?: string;
  inputClassName?: string;
  showLeadingIcon?: boolean;
  onFinalTranscript?: (text: string) => void;
  autoComplete?: string;
};

export function FilterSearchInput({
  value,
  onChange,
  placeholder = 'Rechercher…',
  disabled,
  wrapClassName = 'admin-marketing-search-wrap',
  iconClassName = 'admin-marketing-search-icon',
  inputClassName = 'admin-marketing-search',
  showLeadingIcon = true,
  onFinalTranscript,
  autoComplete = 'off',
}: FilterSearchInputProps) {
  const voice = useVoiceSearchInput({
    onTranscript: (text, isFinal) => {
      onChange(text);
      if (isFinal && onFinalTranscript) onFinalTranscript(text);
    },
  });

  return (
    <div className={cn(wrapClassName)}>
      {showLeadingIcon && <Search className={iconClassName} strokeWidth={1.75} aria-hidden />}
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={voice.voicePlaceholder ?? placeholder}
        disabled={disabled}
        autoComplete={autoComplete}
        className={cn(
          inputClassName,
          voice.isSupported && 'has-voice-search',
          voice.isListening && 'is-voice-listening',
        )}
      />
      {voice.isSupported && (
        <div className="search-voice-mic-slot">
          <VoiceSearchMicButton
            isListening={voice.isListening}
            onToggle={voice.toggleVoice}
            disabled={disabled}
            size="sm"
          />
        </div>
      )}
      {voice.voiceError && (
        <p className="search-voice-error" role="alert">
          {voice.voiceError}
        </p>
      )}
    </div>
  );
}
