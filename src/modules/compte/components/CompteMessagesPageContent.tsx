'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { CompteSidebar, CompteMobileNav } from '@/modules/compte/components/CompteSidebar';
import { CompteTopBar } from '@/modules/compte/components/CompteTopBar';
import { SupportChatShell } from '@/modules/messagerie/components/SupportChatShell';
import { COMPTE_CARD, COMPTE_MAIN, COMPTE_MAIN_FILL, COMPTE_SHELL } from '@/modules/compte/components/compte-ui';
import { fetchApi } from '@/shared/lib/client-fetch';
import { confirmLogout } from '@/shared/lib/confirm-logout';
import type { CustomerProfile } from '@/modules/compte/types';
import type { CompteSectionId } from '@/modules/compte/components/compte-ui';

export function CompteMessagesPageContent() {
  const router = useRouter();
  const [profil, setProfil] = useState<CustomerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const section: CompteSectionId = 'dashboard';

  const redirectingRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function loadProfil() {
      try {
        const res = await fetchApi('/api/compte/profil');
        if (cancelled) return;

        if (res.status === 401 || res.status === 404) {
          if (!redirectingRef.current) {
            redirectingRef.current = true;
            router.replace('/connexion?redirect=/compte/messages');
          }
          return;
        }

        if (res.ok) {
          const data = await res.json();
          setProfil(data.profil as CustomerProfile);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadProfil();
    return () => {
      cancelled = true;
    };
  }, [router]);

  const handleLogout = async () => {
    if (!(await confirmLogout('customer'))) return;
    await fetch('/api/auth/logout', { method: 'POST' });
    router.replace('/');
  };

  if (loading || !profil) {
    return (
      <div className="compte-area flex min-h-[60vh] flex-col items-center justify-center gap-3 bg-[#f7f2f5] text-zinc-900">
        <Loader2 className="h-8 w-8 animate-spin text-[#e91e8c]" />
        <p className="text-sm text-zinc-600">Chargement…</p>
      </div>
    );
  }

  return (
    <div className={`${COMPTE_SHELL} animate-fadeIn`}>
      <CompteSidebar
        profil={profil}
        section={section}
        onSectionChange={() => router.push('/compte')}
        onLogout={handleLogout}
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
      />

      <div className={COMPTE_MAIN}>
        <CompteMobileNav section={section} onMenuOpen={() => setMobileMenuOpen(true)} />
        <CompteTopBar
          profil={profil}
          onProfilUpdate={setProfil}
          onLogout={handleLogout}
        />

        <div className={COMPTE_MAIN_FILL}>
          <header className="mb-4 shrink-0 hidden lg:block">
            <h1 className="font-serif text-2xl font-bold text-zinc-900">Messagerie</h1>
            <p className="mt-1 text-sm text-zinc-500">
              Envoyez des messages, photos et vocaux à l&apos;équipe Love Piment&.
            </p>
          </header>

          <div
            className={`${COMPTE_CARD} flex-1 min-h-[min(520px,70dvh)] overflow-hidden flex flex-col`}
          >
            <SupportChatShell fullHeight />
          </div>
        </div>
      </div>
    </div>
  );
}
