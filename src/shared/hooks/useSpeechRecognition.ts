'use client';

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';

interface UseSpeechRecognitionOptions {
  lang?: string;
  onResult?: (transcript: string, isFinal: boolean) => void;
  onError?: (message: string) => void;
}

function getSpeechRecognitionClass(): (new () => SpeechRecognition) | null {
  if (typeof window === 'undefined') return null;
  return window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null;
}

function subscribeSpeechSupport() {
  return () => {};
}

export function useSpeechRecognition({
  lang = 'fr-FR',
  onResult,
  onError,
}: UseSpeechRecognitionOptions = {}) {
  const [isListening, setIsListening] = useState(false);
  const isSupported = useSyncExternalStore(
    subscribeSpeechSupport,
    () => Boolean(getSpeechRecognitionClass()),
    () => false,
  );
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  const startListening = useCallback(() => {
    const SpeechRecognitionAPI = getSpeechRecognitionClass();

    if (!SpeechRecognitionAPI) {
      onError?.('La recherche vocale n\'est pas supportée par votre navigateur.');
      return;
    }

    recognitionRef.current?.stop();

    const recognition = new SpeechRecognitionAPI();
    recognition.lang = lang;
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);

    recognition.onresult = (event) => {
      let transcript = '';
      let isFinal = false;
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
        if (event.results[i].isFinal) isFinal = true;
      }
      const text = transcript.trim();
      if (text) {
        onResult?.(text, isFinal);
      }
    };

    recognition.onerror = (event) => {
      setIsListening(false);
      if (event.error === 'not-allowed') {
        onError?.('Autorisez le micro dans votre navigateur pour utiliser la recherche vocale.');
      } else if (event.error !== 'aborted') {
        onError?.('Erreur lors de la reconnaissance vocale. Réessayez.');
      }
    };

    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
  }, [lang, onResult, onError]);

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  return { isListening, isSupported, startListening, stopListening };
}
