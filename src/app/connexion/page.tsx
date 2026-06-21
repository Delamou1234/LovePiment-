import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { Lock, ShieldCheck, Truck } from 'lucide-react';
import { LoginForm } from '@/modules/auth/components/LoginForm';
import { AuthSplitLayout } from '@/modules/auth/components/AuthSplitLayout';
import { getSafeRedirect, isAdminRedirect, isCheckoutRedirect } from '@/shared/lib/auth-redirect';
import { getSocialAuthFlags } from '@/shared/lib/auth/social-auth-config';
import { getCustomerSession } from '@/shared/lib/auth/session';

export const metadata: Metadata = {
  title: 'Connexion',
  description: 'Connectez-vous pour finaliser votre commande KabiShop.',
  robots: { index: false, follow: false },
};

type SearchParams = Promise<{ redirect?: string; error?: string }>;

const TRUST = [
  { icon: Truck, label: 'Livraison 24–48h' },
  { icon: Lock, label: 'Paiement sécurisé' },
  { icon: ShieldCheck, label: 'Produits authentiques' },
];

export default async function ConnexionPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { redirect: redirectParam, error } = await searchParams;

  const customer = await getCustomerSession();
  if (customer) {
    const fallback = isCheckoutRedirect(redirectParam) ? '/commande' : '/compte';
    redirect(getSafeRedirect(redirectParam, fallback));
  }

  const isAdmin = isAdminRedirect(redirectParam);
  const isCheckout = isCheckoutRedirect(redirectParam);
  const social = getSocialAuthFlags();

  return (
    <AuthSplitLayout
      panelTitle={
        isCheckout
          ? 'Plus qu’une étape avant votre commande'
          : 'Bienvenue chez KabiShop'
      }
      panelSubtitle="Connectez-vous pour payer, suivre votre livraison et profiter de nos offres."
      trustPoints={TRUST}
    >
      <Suspense fallback={<div className="skeleton h-64 w-full rounded-xl" />}>
        <LoginForm
          variant={isAdmin ? 'admin' : 'customer'}
          googleEnabled={social.google && !isAdmin}
          facebookEnabled={social.facebook && !isAdmin}
          appleEnabled={social.apple && !isAdmin}
          isCheckout={isCheckout}
          initialError={error ? decodeURIComponent(error) : undefined}
        />
      </Suspense>
    </AuthSplitLayout>
  );
}
