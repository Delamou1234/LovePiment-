'use client';

import { useEffect } from 'react';
import { Check } from 'lucide-react';

interface CartToastProps {
  message: string;
  visible: boolean;
  onHide: () => void;
  durationMs?: number;
}

function CartToastInner({
  message,
  onHide,
  durationMs,
}: {
  message: string;
  onHide: () => void;
  durationMs: number;
}) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onHide();
    }, durationMs);
    return () => clearTimeout(timer);
  }, [durationMs, onHide, message]);

  return (
    <div
      role="status"
      className="fixed bottom-6 left-1/2 z-[60] flex -translate-x-1/2 items-center gap-2 rounded-full bg-zinc-900 py-2.5 px-5 text-sm font-medium text-white shadow-xl animate-fadeIn"
    >
      <Check className="h-4 w-4 text-emerald-400" />
      {message}
    </div>
  );
}

export function CartToast({ message, visible, onHide, durationMs = 2500 }: CartToastProps) {
  if (!visible) return null;

  return (
    <CartToastInner
      key={`${message}-${visible}`}
      message={message}
      onHide={onHide}
      durationMs={durationMs}
    />
  );
}
