import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { ShieldCheck, Sparkles, Truck } from 'lucide-react';
import { LoginForm } from '@/modules/auth/components/LoginForm';
import { AuthSplitLayout } from '@/modules/auth/components/AuthSplitLayout';
import {
  isCheckoutRedirect,
  resolveAuthenticatedRedirect,
} from '@/shared/lib/auth-redirect';
import { isValidCustomerSession } from '@/shared/lib/auth/customer-session';
import { customerAuthRepository } from '@/modules/auth/repository/customer-auth.repository';
import {
  getAdminSession,
  getCourierSession,
  getCustomerSession,
} from '@/shared/lib/auth/session';
import { redirectUrlApresSessionExpiree } from '@/shared/lib/auth/stale-session';

export const metadata: Metadata = {
  title: 'Connexion',
  description: 'Connectez-vous à votre compte Love Piment& pour découvrir nos produits exclusifs.',
  robots: { index: false, follow: false },
};

type SearchParams = Promise<{ redirect?: string; error?: string }>;

const PANEL_TRUST = [
  { icon: ShieldCheck, label: 'Paiement 100 % sécurisé', desc: 'Vos transactions sont protégées.' },
  { icon: Truck, label: 'Livraison discrète', desc: 'Emballage neutre et confidentiel.' },
  { icon: Sparkles, label: 'Produits de qualité', desc: 'Sélection rigoureuse et testée.' },
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

  return (
    <AuthSplitLayout
      variant="connexion"
      panelTitle="Votre plaisir, votre bien-être,"
      panelAccent="votre pouvoir"
      panelSubtitle="Connectez-vous à votre compte pour découvrir nos produits exclusifs et profiter d'une expérience personnalisée."
      trustPoints={PANEL_TRUST}
    >
      <Suspense fallback={<div className="auth-connexion-card skeleton h-80 w-full rounded-2xl" />}>
        <LoginForm
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
