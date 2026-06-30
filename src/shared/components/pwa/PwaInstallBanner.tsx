'use client';

import { useCallback, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { Download, Share, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  isClientPwaRoute,
  isIosSafari,
  isMobileViewport,
  isStandaloneDisplayMode,
  PWA_INSTALL_DISMISS_KEY,
  PWA_INSTALL_DONE_KEY,
} from '@/shared/lib/pwa';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

export function PwaInstallBanner() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [iosHint, setIosHint] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  const dismiss = useCallback(() => {
    setVisible(false);
    try {
      localStorage.setItem(PWA_INSTALL_DISMISS_KEY, String(Date.now()));
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (!isClientPwaRoute(pathname)) return;
    if (isStandaloneDisplayMode()) return;

    try {
      if (localStorage.getItem(PWA_INSTALL_DONE_KEY) === '1') return;
      const dismissedAt = Number(localStorage.getItem(PWA_INSTALL_DISMISS_KEY) ?? '0');
      if (dismissedAt && Date.now() - dismissedAt < 7 * 24 * 60 * 60 * 1000) return;
    } catch {
      /* ignore */
    }

    if (!isMobileViewport()) return;

    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setVisible(true);
      setIosHint(false);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstall);

    if (isIosSafari()) {
      const timer = window.setTimeout(() => {
        setIosHint(true);
        setVisible(true);
      }, 2500);
      return () => {
        window.removeEventListener('beforeinstallprompt', onBeforeInstall);
        window.clearTimeout(timer);
      };
    }

    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstall);
  }, [pathname]);

  const install = async () => {
    if (iosHint || !deferredPrompt) return;
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setVisible(false);
    if (choice.outcome === 'accepted') {
      try {
        localStorage.setItem(PWA_INSTALL_DONE_KEY, '1');
      } catch {
        /* ignore */
      }
    }
  };

  if (!visible) return null;

  return (
    <div
      className="safe-area-fab fixed inset-x-3 bottom-3 z-[70] rounded-2xl border border-primary/20 bg-zinc-950/95 p-4 text-white shadow-2xl backdrop-blur-md sm:inset-x-auto sm:right-4 sm:bottom-4 sm:max-w-sm"
      role="dialog"
      aria-label="Installer l'application Love Piment&"
    >
      <button
        type="button"
        onClick={dismiss}
        className="absolute top-3 right-3 rounded-full p-1 text-white/70 hover:bg-white/10 hover:text-white"
        aria-label="Fermer"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex items-start gap-3 pr-6">
        <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl ring-2 ring-white/15">
          <Image
            src="/icons/icon-192.png"
            alt=""
            width={44}
            height={44}
            className="h-full w-full object-cover"
            priority
          />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-bold">Installer Love Piment&</p>
          <p className="text-xs leading-relaxed text-white/75">
            {iosHint
              ? 'Sur iPhone : touchez Partager puis « Sur l’écran d’accueil » pour ouvrir la boutique comme une app.'
              : 'Accédez à la boutique en un tap, sans repasser par le navigateur à chaque fois.'}
          </p>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        {!iosHint && deferredPrompt ? (
          <Button type="button" onClick={install} className="btn-primary h-10 flex-1 rounded-full text-sm font-bold">
            <Download className="mr-2 h-4 w-4" />
            Installer
          </Button>
        ) : iosHint ? (
          <div className="flex h-10 flex-1 items-center justify-center gap-2 rounded-full bg-white/10 text-xs font-semibold text-white/90">
            <Share className="h-4 w-4" />
            Partager → Écran d&apos;accueil
          </div>
        ) : null}
        <Button
          type="button"
          variant="outline"
          onClick={dismiss}
          className="h-10 rounded-full border-white/20 bg-transparent px-4 text-sm text-white hover:bg-white/10"
        >
          Plus tard
        </Button>
      </div>
    </div>
  );
}
