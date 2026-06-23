import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { Lock, ShieldCheck, Truck } from 'lucide-react';
import { LoginForm } from '@/modules/auth/components/LoginForm';
import { AuthSplitLayout } from '@/modules/auth/components/AuthSplitLayout';
import {
  isCheckoutRedirect,
  resolveAuthenticatedRedirect,
} from '@/shared/lib/auth-redirect';
import { isValidCustomerSession } from '@/shared/lib/auth/customer-session';
import { getSocialAuthFlags } from '@/shared/lib/auth/social-auth-config';
import { customerAuthRepository } from '@/modules/auth/repository/customer-auth.repository';
import {
  getAdminSession,
  getCourierSession,
  getCustomerSession,
} from '@/shared/lib/auth/session';
import { redirectUrlApresSessionExpiree } from '@/shared/lib/auth/stale-session';

export const metadata: Metadata = {
  title: 'Connexion',
  description: 'Connexion KabiShop — client, administration ou espace livreur.',
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

  const [customerSession, adminSession, courierSession] = await Promise.all([
    getCustomerSession(),
    getAdminSession(),
    getCourierSession(),
  ]);

  const hasCustomer = isValidCustomerSession(customerSession);
  const hasAdmin = Boolean(adminSession?.id);
  const hasCourier = Boolean(courierSession?.id);

  if (hasCustomer) {
    const row = await customerAuthRepository.trouverParId(customerSession.id);
    if (!row) {
      redirect(redirectUrlApresSessionExpiree(redirectParam ?? '/compte'));
    }
  }

  const target = resolveAuthenticatedRedirect(
    { customer: hasCustomer, admin: hasAdmin, courier: hasCourier },
    redirectParam,
  );
  if (target) {
    redirect(target);
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
      panelSubtitle="Une seule connexion pour clients, équipe admin et livreurs."
      trustPoints={TRUST}
    >
      <Suspense fallback={<div className="skeleton h-64 w-full rounded-xl" />}>
        <LoginForm
          googleEnabled={social.google}
          facebookEnabled={social.facebook}
          appleEnabled={social.apple}
          isCheckout={isCheckout}
          initialError={
            error === 'session_expired'
              ? 'Votre session a expiré ou le compte n\'existe plus. Reconnectez-vous.'
              : error
                ? decodeURIComponent(error)
                : undefined
          }
        />
      </Suspense>
    </AuthSplitLayout>
  );
}
