'use client';

import { useCallback, useRef, useState } from 'react';
import { useRunAfterMount } from '@/shared/hooks/useRunAfterMount';
import Link from 'next/link';
import { X } from 'lucide-react';
import { SupportChatShell } from './SupportChatShell';
import { chatSessionHeaders, syncChatSessionCookie } from '@/shared/lib/chat-session';
import { FloatingContactButtons } from '@/shared/ui/FloatingContactButtons';

interface ChatWidgetProps {
  onOpenAssistant?: () => void;
}

const POLL_OK_MS = 30_000;
const POLL_FAIL_MS = 120_000;

export function ChatWidget({ onOpenAssistant }: ChatWidgetProps = {}) {
  const [open, setOpen] = useState(false);
  const [, setUnread] = useState(0);
  const pollDelayRef = useRef(POLL_OK_MS);

  const loadUnread = useCallback(async () => {
    try {
      const res = await fetch('/api/messagerie/support', { headers: chatSessionHeaders() });
      if (res.status === 503) {
        pollDelayRef.current = POLL_FAIL_MS;
        return;
      }
      if (res.ok) {
        pollDelayRef.current = POLL_OK_MS;
        const data = await res.json();
        setUnread(data.conversation?.nonLuClient ?? 0);
      }
    } catch {
      pollDelayRef.current = POLL_FAIL_MS;
    }
  }, []);

  useRunAfterMount(() => {
    syncChatSessionCookie();
    void loadUnread();

    let timeout: ReturnType<typeof setTimeout>;
    const schedule = () => {
      timeout = setTimeout(async () => {
        await loadUnread();
        schedule();
      }, pollDelayRef.current);
    };
    schedule();

    return () => clearTimeout(timeout);
  }, [loadUnread]);

  useRunAfterMount(() => {
    if (!open) return;
    void loadUnread();
  }, [open, loadUnread]);

  return (
    <>
      <FloatingContactButtons onOpenAssistant={onOpenAssistant} />

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-end p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pr-[max(0.75rem,env(safe-area-inset-right))] sm:p-6 pointer-events-none">
          <div
            className="pointer-events-auto flex h-[min(560px,calc(100dvh-5rem))] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-[#F2D4DC] bg-white shadow-2xl animate-fadeIn"
            role="dialog"
            aria-label="Chat Love Piment&"
          >
            <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3 shrink-0">
              <div>
                <p className="font-serif font-bold text-zinc-900">Support Love Piment&</p>
                <p className="text-[10px] text-zinc-400">Texte, photos et messages vocaux</p>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href="/messages"
                  className="text-[10px] font-medium text-[#9B1B2E] hover:underline"
                  onClick={() => setOpen(false)}
                >
                  Plein écran
                </Link>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-full p-1.5 hover:bg-zinc-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <SupportChatShell className="flex-1 min-h-0" />
          </div>
        </div>
      )}
    </>
  );
}
