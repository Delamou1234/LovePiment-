import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { Gift, Lock, Truck } from 'lucide-react';
import { RegisterForm } from '@/modules/auth/components/RegisterForm';
import { AuthSplitLayout } from '@/modules/auth/components/AuthSplitLayout';
import { getSafeRedirect, isCheckoutRedirect } from '@/shared/lib/auth-redirect';
import { getSocialAuthFlags } from '@/shared/lib/auth/social-auth-config';
import { getCustomerSession } from '@/shared/lib/auth/session';

export const metadata: Metadata = {
  title: 'Inscription',
  description: 'Créez votre compte KabiShop pour commander en ligne.',
  robots: { index: false, follow: false },
};

type SearchParams = Promise<{ redirect?: string }>;

const TRUST = [
  { icon: Gift, label: 'Offres exclusives membres' },
  { icon: Truck, label: 'Suivi commande en direct' },
  { icon: Lock, label: 'Données protégées' },
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
  const social = getSocialAuthFlags();

  return (
    <AuthSplitLayout
      panelTitle="Rejoignez la communauté KabiShop"
      panelSubtitle="Créez votre compte en 30 secondes et profitez d'une expérience d'achat premium à Conakry."
      trustPoints={TRUST}
    >
      <Suspense fallback={<div className="skeleton h-72 w-full rounded-xl" />}>
        <RegisterForm
          isCheckout={isCheckout}
          googleEnabled={social.google}
          facebookEnabled={social.facebook}
          appleEnabled={social.apple}
        />
      </Suspense>
    </AuthSplitLayout>
  );
}
