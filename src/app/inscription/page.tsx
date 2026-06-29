import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { Gift, Lock, Truck } from 'lucide-react';
import { RegisterForm } from '@/modules/auth/components/RegisterForm';
import { AuthSplitLayout } from '@/modules/auth/components/AuthSplitLayout';
import { getSafeRedirect, isCheckoutRedirect } from '@/shared/lib/auth-redirect';
import { getSocialAuthProviders } from '@/shared/lib/auth/social-providers';
import { getCustomerSession } from '@/shared/lib/auth/session';

export const metadata: Metadata = {
  title: 'Inscription',
  description: 'Créez votre compte Love Piment& pour commander en ligne.',
  robots: { index: false, follow: false },
};

type SearchParams = Promise<{ redirect?: string }>;

const PANEL_TRUST = [
  { icon: Gift, label: 'Offres exclusives membres', desc: 'Promotions réservées aux inscrites.' },
  { icon: Truck, label: 'Suivi commande en direct', desc: 'Livraison discrète à Conakry.' },
  { icon: Lock, label: 'Données protégées', desc: 'Vos informations restent confidentielles.' },
];

export default async function InscriptionPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { redirect: redirectParam } = await searchParams;

  const customer = await getCustomerSession();
  if (customer) {
    redirect(getSafeRedirect(redirectParam, '/compte'));
  }

  const isCheckout = isCheckoutRedirect(redirectParam);
  const socialProviders = getSocialAuthProviders();

  return (
    <AuthSplitLayout
      variant="connexion"
      panelTitle="Créez votre compte,"
      panelAccent="en toute discrétion"
      panelSubtitle="Rejoignez Love Piment& en quelques secondes pour profiter d'une expérience d'achat personnalisée."
      trustPoints={PANEL_TRUST}
      compactForm
    >
      <Suspense fallback={<div className="auth-connexion-card skeleton h-96 w-full rounded-2xl" />}>
        <RegisterForm isCheckout={isCheckout} socialProviders={socialProviders} />
      </Suspense>
    </AuthSplitLayout>
  );
}
