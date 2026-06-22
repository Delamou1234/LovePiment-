'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { usePageTracking } from '@/shared/hooks/useTracking';
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
  usePageTracking();

  useEffect(() => {
    const enable = () => setDeferSocial(true);

    if ('requestIdleCallback' in window) {
      const id = window.requestIdleCallback(enable, { timeout: 2500 });
      return () => window.cancelIdleCallback(id);
    }

    const t = window.setTimeout(enable, 1800);
    return () => window.clearTimeout(t);
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
