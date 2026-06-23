'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { FloatingContactButtons } from '@/shared/ui/FloatingContactButtons';

const AssistantWidget = dynamic(
  () =>
    import('@/modules/ia/components/AssistantWidget').then((m) => ({
      default: m.AssistantWidget,
    })),
  { ssr: false },
);

/** Widgets lourds chargés après le contenu principal (IA, WhatsApp, panier). */
export function BoutiqueWidgets() {
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [deferSocial, setDeferSocial] = useState(false);

  useEffect(() => {
    const enable = () => setDeferSocial(true);

    if (typeof window.requestIdleCallback === 'function') {
      const id = window.requestIdleCallback(enable, { timeout: 2500 });
      return () => window.cancelIdleCallback(id);
    }

    const t = setTimeout(enable, 1800);
    return () => clearTimeout(t);
  }, []);

  return (
    <>
      {deferSocial && (
        <>
          <FloatingContactButtons onOpenAssistant={() => setAssistantOpen(true)} />
          <AssistantWidget open={assistantOpen} onOpenChange={setAssistantOpen} />
        </>
      )}
    </>
  );
}
