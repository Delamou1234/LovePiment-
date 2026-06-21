'use client';

import { useEffect, useRef, useState } from 'react';
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
import type {
  CustomerAddress,
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
  const [adresses, setAdresses] = useState<CustomerAddress[]>([]);
  const [avisEnAttente, setAvisEnAttente] = useState(0);
  const [loading, setLoading] = useState(true);
  const redirectingRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetchApi('/api/compte/overview');

        if (cancelled) return;

        if (res.status === 401 || res.status === 404) {
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
          setAdresses(data.adresses ?? []);
          setAvisEnAttente((data.avisEligibles ?? []).length);
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

  useEffect(() => {
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
    await fetch('/api/auth/logout', { method: 'POST' });
    router.replace('/');
  };

  const goTo = (id: CompteSectionId) => setSection(id);

  const sectionMeta = COMPTE_NAV_GROUPS.flatMap((g) => g.items).find(
    (i) => i.kind === 'section' && i.id === section,
  );

  if (loading || !profil) {
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
        />

        <div className={COMPTE_MAIN_SCROLL}>
          {section !== 'dashboard' && section !== 'commandes' && sectionMeta && (
            <header className="mb-6 hidden lg:block">
              <h1 className="font-serif text-2xl font-bold text-zinc-900">{sectionMeta.label}</h1>
            </header>
          )}

          {section === 'dashboard' && (
            <CompteDashboard
              profil={profil}
              commandes={commandes}
              wishlist={wishlist}
              adresses={adresses}
              avisEnAttente={avisEnAttente}
              onProfilUpdate={setProfil}
              onEditProfil={() => goTo('profil')}
              onVoirCommandes={() => goTo('commandes')}
              onVoirFavoris={() => goTo('favoris')}
              onVoirAdresses={() => goTo('adresses')}
              onVoirProfil={() => goTo('profil')}
              onVoirFidelite={() => goTo('fidelite')}
            />
          )}

          {section === 'commandes' && <CompteCommandesSection commandes={commandes} />}
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
