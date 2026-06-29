'use client';

import { useCallback, useState } from 'react';
import { useSpeechRecognition } from '@/shared/hooks/useSpeechRecognition';

type Options = {
  onTranscript: (text: string, isFinal: boolean) => void;
};

export function useVoiceSearchInput({ onTranscript }: Options) {
  const [voiceError, setVoiceError] = useState('');

  const { isListening, isSupported, startListening, stopListening } = useSpeechRecognition({
    lang: 'fr-FR',
    onResult: onTranscript,
    onError: setVoiceError,
  });

  const toggleVoice = useCallback(() => {
    setVoiceError('');
    if (isListening) stopListening();
    else startListening();
  }, [isListening, startListening, stopListening]);

  return {
    isListening,
    isSupported,
    toggleVoice,
    voiceError,
    voicePlaceholder: isListening ? 'Parlez maintenant…' : undefined,
  };
}
