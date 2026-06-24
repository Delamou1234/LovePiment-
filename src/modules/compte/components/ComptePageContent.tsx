'use client';

import { useEffect, useRef, useState } from 'react';
import { useRunAfterMount } from '@/shared/hooks/useRunAfterMount';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { CompteAdressesSection } from './CompteAdressesSection';
import { CompteWishlistSection } from './CompteWishlistSection';
import { CompteCommandesSection } from './CompteCommandesSection';
import { CompteProfilForms } from './CompteProfilForms';
import { CompteSidebar, CompteMobileNav } from './CompteSidebar';
import { CompteTopBar } from './CompteTopBar';
import { CompteDashboard } from './CompteDashboard';
import { CompteFideliteSection } from '@/modules/marketing/components/CompteFideliteSection';
import { ParrainagePendingSync } from '@/modules/marketing/components/ParrainagePendingSync';
import { CompteAvisSection } from '@/modules/avis/components/CompteAvisSection';
import { COMPTE_MAIN, COMPTE_MAIN_SCROLL, COMPTE_NAV_GROUPS, COMPTE_SHELL, type CompteSectionId } from './compte-ui';
import { fetchApi } from '@/shared/lib/client-fetch';
import { confirmLogout } from '@/shared/lib/confirm-logout';
import type {
  CustomerDashboardData,
  CustomerOrderResume,
  CustomerProfile,
  WishlistItemClient,
} from '@/modules/compte/types';

export function ComptePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [section, setSection] = useState<CompteSectionId>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profil, setProfil] = useState<CustomerProfile | null>(null);
  const [commandes, setCommandes] = useState<CustomerOrderResume[]>([]);
  const [wishlist, setWishlist] = useState<WishlistItemClient[]>([]);
  const [dashboard, setDashboard] = useState<CustomerDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const redirectingRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetchApi('/api/compte/overview');

        if (cancelled) return;

        if (res.status === 401) {
          if (!redirectingRef.current) {
            redirectingRef.current = true;
            router.replace('/connexion?redirect=/compte');
          }
          return;
        }

        if (res.ok) {
          const data = await res.json();
          setProfil(data.profil as CustomerProfile);
          setCommandes(data.commandes ?? []);
          setWishlist(data.wishlist ?? []);
          setDashboard(data.dashboard ?? null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [router]);

  useRunAfterMount(() => {
    const requested = searchParams.get('section');
    if (!requested) return;

    const validSections: CompteSectionId[] = [
      'dashboard',
      'commandes',
      'favoris',
      'adresses',
      'profil',
      'fidelite',
      'avis',
    ];
    if (validSections.includes(requested as CompteSectionId)) {
      setSection(requested as CompteSectionId);
    }
  }, [searchParams]);

  const handleLogout = async () => {
    if (!(await confirmLogout('customer'))) return;
    await fetch('/api/auth/logout', { method: 'POST' });
    router.replace('/');
  };

  const goTo = (id: CompteSectionId) => setSection(id);

  const refreshOverview = async () => {
    const res = await fetchApi('/api/compte/overview');
    if (res.ok) {
      const data = await res.json();
      setCommandes(data.commandes ?? []);
      if (data.profil) setProfil(data.profil as CustomerProfile);
      if (data.dashboard) setDashboard(data.dashboard as CustomerDashboardData);
    }
  };

  const sectionMeta = COMPTE_NAV_GROUPS.flatMap((g) => g.items).find(
    (i) => i.kind === 'section' && i.id === section,
  );

  if (loading || !profil || !dashboard) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 bg-cream">
        <Loader2 className="h-8 w-8 animate-spin text-olive" />
        <p className="text-sm text-zinc-500">Chargement de votre espace…</p>
      </div>
    );
  }

  return (
    <div className={`${COMPTE_SHELL} animate-fadeIn`}>
      <ParrainagePendingSync />
      <CompteSidebar
        profil={profil}
        section={section}
        offreBienvenue={dashboard?.offreBienvenue}
        onSectionChange={setSection}
        onLogout={handleLogout}
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
      />

      <div className={COMPTE_MAIN}>
        <CompteMobileNav
          section={section}
          onMenuOpen={() => setMobileMenuOpen(true)}
        />
        <CompteTopBar
          profil={profil}
          activeSection={section}
          onProfilUpdate={setProfil}
          onLogout={handleLogout}
          onGoToSection={goTo}
          minimal={section === 'dashboard'}
        />

        <div className={COMPTE_MAIN_SCROLL}>
          {section !== 'dashboard' && section !== 'commandes' && sectionMeta && (
            <header className="mb-6 hidden lg:block">
              <h1 className="font-serif text-2xl font-bold text-zinc-900">{sectionMeta.label}</h1>
            </header>
          )}

          {section === 'dashboard' && dashboard && (
            <CompteDashboard
              profil={profil}
              commandes={commandes}
              dashboard={dashboard}
              onVoirCommandes={() => goTo('commandes')}
              onVoirFavoris={() => goTo('favoris')}
              onVoirAdresses={() => goTo('adresses')}
              onVoirProfil={() => goTo('profil')}
              onVoirFidelite={() => goTo('fidelite')}
              onVoirAvis={() => goTo('avis')}
            />
          )}

          {section === 'commandes' && (
            <CompteCommandesSection commandes={commandes} onRefresh={refreshOverview} />
          )}
          {section === 'adresses' && <CompteAdressesSection />}
          {section === 'favoris' && <CompteWishlistSection initialItems={wishlist} />}
          {section === 'profil' && (
            <CompteProfilForms profil={profil} onProfilUpdate={setProfil} />
          )}
          {section === 'fidelite' && (
            <CompteFideliteSection
              pointsFidelite={profil.pointsFidelite}
              codeParrainage={profil.codeParrainage}
            />
          )}
          {section === 'avis' && <CompteAvisSection />}
        </div>
      </div>
    </div>
  );
}
