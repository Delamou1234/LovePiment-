import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { KeyRound, Lock, Mail } from 'lucide-react';
import { ForgotPasswordForm } from '@/modules/auth/components/ForgotPasswordForm';
import { AuthSplitLayout } from '@/modules/auth/components/AuthSplitLayout';
import { getCustomerSession } from '@/shared/lib/auth/session';

export const metadata: Metadata = {
  title: 'Mot de passe oublié',
  description: 'Réinitialisez votre mot de passe Love Piment&.',
  robots: { index: false, follow: false },
};

const PANEL_TRUST = [
  { icon: Mail, label: 'Code envoyé par e-mail', desc: 'Vérifiez aussi vos spams.' },
  { icon: KeyRound, label: 'Code valide 15 min', desc: 'Saisissez-le rapidement.' },
  { icon: Lock, label: 'Connexion sécurisée', desc: 'Choisissez un nouveau mot de passe.' },
];

export default async function MotDePasseOubliePage() {
  const customer = await getCustomerSession();
  if (customer) {
    redirect('/compte');
  }

  return (
    <AuthSplitLayout
      variant="connexion"
      panelTitle="Retrouvez l'accès,"
      panelAccent="en quelques minutes"
      panelSubtitle="Nous vous enverrons un code à 8 chiffres par e-mail pour définir un nouveau mot de passe."
      trustPoints={PANEL_TRUST}
    >
      <Suspense fallback={<div className="auth-connexion-card skeleton h-80 w-full rounded-2xl" />}>
        <ForgotPasswordForm />
      </Suspense>
    </AuthSplitLayout>
  );
}
