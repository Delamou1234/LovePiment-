import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { Lock, ShieldCheck, Truck } from 'lucide-react';
import { LoginForm } from '@/modules/auth/components/LoginForm';
import { AuthSplitLayout } from '@/modules/auth/components/AuthSplitLayout';
import {
  getSafeRedirect,
  getSafeRedirectForCustomer,
  isAdminRedirect,
  isCheckoutRedirect,
} from '@/shared/lib/auth-redirect';
import { isValidCustomerSession } from '@/shared/lib/auth/customer-session';
import { getSocialAuthFlags } from '@/shared/lib/auth/social-auth-config';
import { adminAuthRepository } from '@/modules/auth/repository/admin-auth.repository';
import { getCustomerSession, getSession } from '@/shared/lib/auth/session';

export const metadata: Metadata = {
  title: 'Connexion',
  description: 'Connectez-vous pour finaliser votre commande KabiShop.',
  robots: { index: false, follow: false },
};

type SearchParams = Promise<{ redirect?: string; error?: string; admin?: string }>;

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
  const { redirect: redirectParam, error, admin: adminParam } = await searchParams;
  const isAdmin = isAdminRedirect(redirectParam) || adminParam === '1';

  if (isAdmin) {
    const session = await getSession();
    if (session?.role === 'admin') {
      const admin =
        (session.id ? await adminAuthRepository.trouverParId(session.id) : null) ??
        (await adminAuthRepository.trouverParEmail(session.email));
      if (admin?.actif) {
        redirect(getSafeRedirect(redirectParam, '/admin'));
      }
    }
  }

  const customer = await getCustomerSession();
  if (isValidCustomerSession(customer) && !isAdmin) {
    const fallback = isCheckoutRedirect(redirectParam) ? '/commande' : '/compte';
    redirect(getSafeRedirectForCustomer(redirectParam, fallback));
  }

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
