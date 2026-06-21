'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Loader2, Send, Sparkles, X } from 'lucide-react';
import type { MessageAssistant, ReponseAssistant } from '@/modules/ia/types';

const SUGGESTIONS = [
  'Quel parfum pour un cadeau ?',
  'Huile ou crème pour peau sèche ?',
  'Livraison à Conakry ?',
];

interface AssistantWidgetProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function AssistantWidget({ open: openProp, onOpenChange }: AssistantWidgetProps = {}) {
  const [openInternal, setOpenInternal] = useState(false);
  const open = openProp ?? openInternal;
  const setOpen = onOpenChange ?? setOpenInternal;
  const [messages, setMessages] = useState<MessageAssistant[]>([
    {
      role: 'assistant',
      content:
        'Bonjour ! Je suis l\'assistant KabiShop. Demandez-moi des conseils produits, des idées cadeaux ou de l\'aide pour votre commande.',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || loading) return;

      const userMsg: MessageAssistant = { role: 'user', content: trimmed };
      const historique = messages.filter(
        (m) =>
          !m.content.startsWith('__products__') &&
          (m.role === 'user' || m.role === 'assistant'),
      );
      setMessages((prev) => [...prev, userMsg]);
      setInput('');
      setLoading(true);

      try {
        const res = await fetch('/api/ia/assistant', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: trimmed, historique }),
        });

        const data = (await res.json()) as ReponseAssistant & { message?: string };

        if (!res.ok) {
          throw new Error(data.message ?? 'Erreur assistant');
        }

        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: data.reply },
        ]);

        if (data.products?.length) {
          setMessages((prev) => [
            ...prev,
            {
              role: 'assistant',
              content: `__products__:${JSON.stringify(data.products)}`,
            },
          ]);
        }
      } catch (err) {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content:
              err instanceof Error
                ? err.message
                : 'Assistant indisponible. Réessayez dans un instant.',
          },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [loading, messages],
  );

  const renderMessage = (msg: MessageAssistant, index: number) => {
    if (msg.content.startsWith('__products__:')) {
      try {
        const products = JSON.parse(msg.content.replace('__products__:', '')) as ReponseAssistant['products'];
        return (
          <div key={index} className="flex justify-start">
            <div className="max-w-[90%] grid grid-cols-2 gap-2">
              {products.map((p) => (
                <Link
                  key={p.id}
                  href={`/produits/${p.slug}`}
                  onClick={() => setOpen(false)}
                  className="flex gap-2 rounded-xl border border-[#ebe4d8] bg-white p-2 hover:border-[#4a5240] transition"
                >
                  <div className="relative h-12 w-12 shrink-0 rounded-lg overflow-hidden bg-[#f5f0e8]">
                    {p.image && (
                      <Image src={p.image} alt="" fill className="object-cover" sizes="48px" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold text-zinc-900 line-clamp-2">{p.nom}</p>
                    <p className="text-[10px] font-bold text-[#4a5240]">
                      {p.prix.toLocaleString('fr-FR')} GN
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        );
      } catch {
        return null;
      }
    }

    const isUser = msg.role === 'user';
    return (
      <div key={index} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
        <div
          className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
            isUser
              ? 'bg-[#4a5240] text-white rounded-br-md'
              : 'bg-[#f5f0e8] text-zinc-800 rounded-bl-md'
          }`}
        >
          {msg.content}
        </div>
      </div>
    );
  };

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-end p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pr-[max(0.75rem,env(safe-area-inset-right))] sm:p-6 pointer-events-none">
          <div
            className="pointer-events-auto flex h-[min(520px,calc(100dvh-5rem))] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-[#ebe4d8] bg-white shadow-2xl animate-fadeIn"
            role="dialog"
            aria-label="Assistant IA KabiShop"
          >
            <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3 shrink-0 bg-[#faf7f2]">
              <div>
                <p className="font-serif font-bold text-zinc-900 flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-[#4a5240]" />
                  Assistant KabiShop
                </p>
                <p className="text-[10px] text-zinc-400">Propulsé par Gemini Flash</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full p-1.5 hover:bg-zinc-200/60"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
              {messages.map((msg, i) => renderMessage(msg, i))}
              {loading && (
                <div className="flex justify-start">
                  <div className="rounded-2xl bg-[#f5f0e8] px-4 py-2.5">
                    <Loader2 className="h-4 w-4 animate-spin text-[#4a5240]" />
                  </div>
                </div>
              )}
            </div>

            {messages.length <= 2 && (
              <div className="px-4 pb-2 flex flex-wrap gap-1.5 shrink-0">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => sendMessage(s)}
                    className="text-[10px] rounded-full border border-[#ebe4d8] px-2.5 py-1 text-zinc-600 hover:bg-[#faf7f2] hover:border-[#4a5240]"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            <form
              className="border-t border-zinc-100 p-3 flex gap-2 shrink-0"
              onSubmit={(e) => {
                e.preventDefault();
                void sendMessage(input);
              }}
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Posez votre question…"
                disabled={loading}
                className="input-kabishop flex-1 text-sm"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#4a5240] text-white disabled:opacity-50"
                aria-label="Envoyer"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
