'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { usePageTracking } from '@/shared/hooks/useTracking';

const CartDrawer = dynamic(
  () => import('@/shared/ui/CartDrawer').then((m) => ({ default: m.CartDrawer })),
  { ssr: false },
);

const AssistantWidget = dynamic(
  () =>
    import('@/modules/ia/components/AssistantWidget').then((m) => ({
      default: m.AssistantWidget,
    })),
  { ssr: false },
);

const ChatWidget = dynamic(
  () =>
    import('@/modules/messagerie/components/ChatWidget').then((m) => ({
      default: m.ChatWidget,
    })),
  { ssr: false },
);

/** Widgets lourds chargés après le contenu principal (chat, IA, panier). */
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
      <CartDrawer />
      {deferSocial && (
        <>
          <AssistantWidget open={assistantOpen} onOpenChange={setAssistantOpen} />
          <ChatWidget onOpenAssistant={() => setAssistantOpen(true)} />
        </>
      )}
    </>
  );
}
