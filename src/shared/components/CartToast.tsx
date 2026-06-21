'use client';

import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';

interface CartToastProps {
  message: string;
  visible: boolean;
  onHide: () => void;
  durationMs?: number;
}

export function CartToast({ message, visible, onHide, durationMs = 2500 }: CartToastProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!visible) {
      setShow(false);
      return;
    }
    setShow(true);
    const timer = setTimeout(() => {
      setShow(false);
      onHide();
    }, durationMs);
    return () => clearTimeout(timer);
  }, [visible, durationMs, onHide]);

  if (!show) return null;

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
