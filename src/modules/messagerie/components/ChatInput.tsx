'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ImagePlus,
  Loader2,
  Mic,
  Paperclip,
  Send,
  Trash2,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatRecordingTime } from '../lib/format';
import { ImageUploadPreview } from './ImageMessagePreview';

type ChatInputProps = {
  disabled?: boolean;
  onSendText: (text: string) => Promise<void>;
  onUpload: (file: File, dureeMs?: number, caption?: string) => Promise<void>;
  onTyping?: (typing: boolean) => void;
};

type ComposerMode = 'text' | 'recording' | 'voice-preview';

export function ChatInput({ disabled, onSendText, onUpload, onTyping }: ChatInputProps) {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [mode, setMode] = useState<ComposerMode>('text');
  const [recordMs, setRecordMs] = useState(0);
  const [pendingImage, setPendingImage] = useState<File | null>(null);
  const [imageCaption, setImageCaption] = useState('');
  const [voiceBlob, setVoiceBlob] = useState<Blob | null>(null);
  const [voiceDurationMs, setVoiceDurationMs] = useState(0);
  const voicePreviewUrl = useMemo(
    () => (voiceBlob ? URL.createObjectURL(voiceBlob) : null),
    [voiceBlob],
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (voicePreviewUrl) URL.revokeObjectURL(voicePreviewUrl);
    };
  }, [voicePreviewUrl]);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recordStartRef = useRef<number>(0);
  const recordTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const imageRef = useRef<HTMLInputElement>(null);
  const docRef = useRef<HTMLInputElement>(null);
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stopStream = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

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
    setError(null);
    onTyping?.(false);
    try {
      await onSendText(trimmed);
      setText('');
    } catch {
      setError('Envoi impossible.');
    } finally {
      setSending(false);
    }
  };

  const sendImage = async () => {
    if (!pendingImage || sending) return;
    setSending(true);
    setError(null);
    try {
      await onUpload(pendingImage, undefined, imageCaption.trim() || undefined);
      setPendingImage(null);
      setImageCaption('');
    } catch {
      setError('Envoi de l\'image impossible.');
    } finally {
      setSending(false);
    }
  };

  const handleDoc = async (file: File | undefined) => {
    if (!file || sending) return;
    setSending(true);
    setError(null);
    try {
      await onUpload(file);
    } catch {
      setError('Envoi du document impossible.');
    } finally {
      setSending(false);
    }
  };

  const handleImagePick = (file: File | undefined) => {
    if (!file || sending) return;
    if (!file.type.startsWith('image/')) {
      setError('Choisissez une image (JPG, PNG, WebP).');
      return;
    }
    setPendingImage(file);
    setImageCaption('');
    setError(null);
  };

  const startRecording = async () => {
    if (disabled || sending || mode !== 'text') return;
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        stopStream();
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const duration = Date.now() - recordStartRef.current;
        if (duration < 600) {
          setMode('text');
          setRecordMs(0);
          return;
        }
        setVoiceBlob(blob);
        setVoiceDurationMs(duration);
        setMode('voice-preview');
        setRecordMs(0);
      };

      recorderRef.current = recorder;
      recordStartRef.current = Date.now();
      recorder.start(100);
      setMode('recording');
      setRecordMs(0);
      recordTimerRef.current = setInterval(() => {
        setRecordMs(Date.now() - recordStartRef.current);
      }, 100);
    } catch {
      setError('Autorisez le micro pour enregistrer un vocal.');
    }
  };

  const cancelRecording = () => {
    if (recordTimerRef.current) clearInterval(recordTimerRef.current);
    recorderRef.current?.stop();
    recorderRef.current = null;
    stopStream();
    setMode('text');
    setRecordMs(0);
  };

  const stopRecording = () => {
    if (recordTimerRef.current) clearInterval(recordTimerRef.current);
    recorderRef.current?.stop();
    recorderRef.current = null;
  };

  const discardVoice = () => {
    setVoiceBlob(null);
    setVoiceDurationMs(0);
    setMode('text');
  };

  const sendVoice = async () => {
    if (!voiceBlob || sending) return;
    setSending(true);
    setError(null);
    try {
      const file = new File([voiceBlob], `voice-${Date.now()}.webm`, { type: 'audio/webm' });
      await onUpload(file, voiceDurationMs);
      discardVoice();
    } catch {
      setError('Envoi du vocal impossible.');
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    return () => {
      if (recordTimerRef.current) clearInterval(recordTimerRef.current);
      stopStream();
    };
  }, []);

  return (
    <div className="shrink-0 border-t border-beige-border/80 bg-white">
      {pendingImage && (
        <div className="border-b border-beige-border/60 bg-cream/40 px-3 py-3">
          <div className="flex items-start gap-3">
            <ImageUploadPreview file={pendingImage} onRemove={() => setPendingImage(null)} />
            <div className="flex-1 min-w-0 space-y-2">
              <input
                value={imageCaption}
                onChange={(e) => setImageCaption(e.target.value)}
                placeholder="Ajouter une légende (optionnel)…"
                className="input-shop w-full text-sm py-2"
                disabled={sending}
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={sendImage}
                  disabled={sending}
                  className="inline-flex items-center gap-1.5 rounded-full bg-olive px-4 py-2 text-xs font-bold text-white hover:bg-olive-dark disabled:opacity-50"
                >
                  {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                  Envoyer la photo
                </button>
                <button
                  type="button"
                  onClick={() => setPendingImage(null)}
                  className="rounded-full px-3 py-2 text-xs font-medium text-zinc-500 hover:bg-zinc-100"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {mode === 'recording' && (
        <div className="flex items-center gap-3 bg-red-50 px-4 py-3">
          <span className="relative flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500" />
          </span>
          <span className="flex-1 text-sm font-semibold text-red-700 tabular-nums">
            {formatRecordingTime(recordMs)}
          </span>
          <div className="flex items-center gap-1">
            {[...Array(12)].map((_, i) => (
              <span
                key={i}
                className="w-0.5 rounded-full bg-red-300 animate-pulse"
                style={{
                  height: `${8 + ((i * 7 + recordMs / 80) % 16)}px`,
                  animationDelay: `${i * 40}ms`,
                }}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={cancelRecording}
            className="rounded-full p-2 text-red-600 hover:bg-red-100"
            title="Annuler"
          >
            <Trash2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={stopRecording}
            className="rounded-full bg-olive p-2.5 text-white hover:bg-olive-dark"
            title="Terminer l'enregistrement"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      )}

      {mode === 'voice-preview' && voiceBlob && (
        <div className="flex items-center gap-3 border-b border-beige-border/60 bg-cream/40 px-4 py-3">
          <Mic className="h-5 w-5 text-olive shrink-0" />
          <audio
            controls
            src={voicePreviewUrl ?? undefined}
            className="h-9 flex-1 max-w-[240px]"
          />
          <span className="text-xs text-zinc-500 tabular-nums shrink-0">
            {formatRecordingTime(voiceDurationMs)}
          </span>
          <button
            type="button"
            onClick={discardVoice}
            className="rounded-full p-2 text-zinc-500 hover:bg-zinc-100"
            title="Supprimer"
          >
            <X className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={sendVoice}
            disabled={sending}
            className="rounded-full bg-olive p-2.5 text-white hover:bg-olive-dark disabled:opacity-50"
            title="Envoyer"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </div>
      )}

      {mode === 'text' && !pendingImage && (
        <div className="p-3">
          {error && (
            <p className="mb-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>
          )}
          <div className="flex items-end gap-2">
            <div className="flex shrink-0 gap-0.5">
              <button
                type="button"
                disabled={disabled || sending}
                onClick={() => imageRef.current?.click()}
                className="rounded-xl p-2.5 text-zinc-500 transition hover:bg-cream hover:text-olive"
                title="Photo"
              >
                <ImagePlus className="h-5 w-5" />
              </button>
              <button
                type="button"
                disabled={disabled || sending}
                onClick={() => docRef.current?.click()}
                className="rounded-xl p-2.5 text-zinc-500 transition hover:bg-cream hover:text-olive"
                title="Document"
              >
                <Paperclip className="h-5 w-5" />
              </button>
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
              disabled={disabled || sending}
              placeholder="Message…"
              className="input-shop min-h-[44px] max-h-32 flex-1 resize-none rounded-2xl border-beige-border bg-cream/30 py-3 text-[15px]"
            />

            {text.trim() ? (
              <Button
                type="button"
                disabled={disabled || sending}
                onClick={submitText}
                className="btn-primary h-11 w-11 shrink-0 rounded-full p-0"
              >
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            ) : (
              <button
                type="button"
                disabled={disabled || sending}
                onClick={startRecording}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-olive text-white transition hover:bg-olive-dark disabled:opacity-50"
                title="Message vocal"
              >
                <Mic className="h-5 w-5" />
              </button>
            )}
          </div>
          <p className="mt-2 hidden text-center text-[10px] text-zinc-400 sm:block">
            Entrée pour envoyer · Shift+Entrée pour un retour à la ligne
          </p>
        </div>
      )}

      <input
        ref={imageRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          handleImagePick(e.target.files?.[0]);
          e.target.value = '';
        }}
      />
      <input
        ref={docRef}
        type="file"
        accept=".pdf,.doc,.docx,.txt,application/pdf"
        className="hidden"
        onChange={(e) => {
          void handleDoc(e.target.files?.[0]);
          e.target.value = '';
        }}
      />
    </div>
  );
}
