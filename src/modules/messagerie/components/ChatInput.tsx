'use client';

import { useCallback, useRef, useState } from 'react';
import { ImagePlus, Mic, Paperclip, Send, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';

type ChatInputProps = {
  disabled?: boolean;
  onSendText: (text: string) => Promise<void>;
  onUpload: (file: File, dureeMs?: number) => Promise<void>;
  onTyping?: (typing: boolean) => void;
};

export function ChatInput({ disabled, onSendText, onUpload, onTyping }: ChatInputProps) {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [recording, setRecording] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recordStartRef = useRef<number>(0);
  const imageRef = useRef<HTMLInputElement>(null);
  const docRef = useRef<HTMLInputElement>(null);
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleTyping = useCallback(
    (value: string) => {
      setText(value);
      onTyping?.(true);
      if (typingTimeout.current) clearTimeout(typingTimeout.current);
      typingTimeout.current = setTimeout(() => onTyping?.(false), 1500);
    },
    [onTyping],
  );

  const submitText = async () => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setSending(true);
    onTyping?.(false);
    try {
      await onSendText(trimmed);
      setText('');
    } finally {
      setSending(false);
    }
  };

  const handleFile = async (file: File | undefined) => {
    if (!file || sending) return;
    setSending(true);
    try {
      await onUpload(file);
    } finally {
      setSending(false);
    }
  };

  const startRecording = async () => {
    if (recording || disabled) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const duration = Date.now() - recordStartRef.current;
        const file = new File([blob], `voice-${Date.now()}.webm`, { type: 'audio/webm' });
        setSending(true);
        try {
          await onUpload(file, duration);
        } finally {
          setSending(false);
        }
      };
      recorderRef.current = recorder;
      recordStartRef.current = Date.now();
      recorder.start();
      setRecording(true);
    } catch {
      /* micro refusé */
    }
  };

  const stopRecording = () => {
    recorderRef.current?.stop();
    recorderRef.current = null;
    setRecording(false);
  };

  return (
    <div className="border-t border-zinc-100 bg-white p-3">
      <div className="flex items-end gap-2">
        <div className="flex gap-1">
          <button
            type="button"
            disabled={disabled || sending}
            onClick={() => imageRef.current?.click()}
            className="rounded-full p-2 text-zinc-500 hover:bg-zinc-100 transition"
            title="Envoyer une image"
          >
            <ImagePlus className="h-4 w-4" />
          </button>
          <button
            type="button"
            disabled={disabled || sending}
            onClick={() => docRef.current?.click()}
            className="rounded-full p-2 text-zinc-500 hover:bg-zinc-100 transition"
            title="Envoyer un document"
          >
            <Paperclip className="h-4 w-4" />
          </button>
          {!recording ? (
            <button
              type="button"
              disabled={disabled || sending}
              onClick={startRecording}
              className="rounded-full p-2 text-zinc-500 hover:bg-zinc-100 transition"
              title="Message vocal"
            >
              <Mic className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={stopRecording}
              className="rounded-full p-2 bg-red-100 text-red-600 animate-pulse"
              title="Arrêter l'enregistrement"
            >
              <Square className="h-4 w-4 fill-current" />
            </button>
          )}
        </div>

        <textarea
          value={text}
          onChange={(e) => handleTyping(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              submitText();
            }
          }}
          rows={1}
          disabled={disabled || sending || recording}
          placeholder="Écrivez votre message…"
          className="input-kabishop flex-1 min-h-[42px] max-h-28 resize-none py-2.5"
        />

        <Button
          type="button"
          disabled={disabled || sending || !text.trim() || recording}
          onClick={submitText}
          className="btn-primary rounded-full h-10 w-10 p-0 shrink-0"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>

      <input
        ref={imageRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      <input
        ref={docRef}
        type="file"
        accept=".pdf,.doc,.docx,.txt,application/pdf"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
    </div>
  );
}
