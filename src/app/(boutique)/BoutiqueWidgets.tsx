'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';
import { FloatingContactButtons } from '@/shared/ui/FloatingContactButtons';

const AssistantWidget = dynamic(
  () =>
    import('@/modules/ia/components/AssistantWidget').then((m) => ({
      default: m.AssistantWidget,
    })),
  { ssr: false },
);

/** Widgets flottants chargés après le contenu principal (recommandations, WhatsApp, panier). */
export function BoutiqueWidgets() {
  const pathname = usePathname();
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [deferSocial, setDeferSocial] = useState(false);

  const isProductDetail =
    pathname.startsWith('/produits/') && pathname !== '/produits';
  const isCartPage = pathname === '/panier';
  const fabClassName = isProductDetail || isCartPage ? 'safe-area-fab safe-area-fab--above-bar' : 'safe-area-fab';

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
          <FloatingContactButtons
            onOpenAssistant={() => setAssistantOpen(true)}
            className={fabClassName}
          />
          <AssistantWidget open={assistantOpen} onOpenChange={setAssistantOpen} />
        </>
      )}
    </>
  );
}
