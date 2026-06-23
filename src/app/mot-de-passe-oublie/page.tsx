import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { KeyRound, Lock, Mail } from 'lucide-react';
import { ForgotPasswordForm } from '@/modules/auth/components/ForgotPasswordForm';
import { AuthSplitLayout } from '@/modules/auth/components/AuthSplitLayout';
import { getCustomerSession } from '@/shared/lib/auth/session';

export const metadata: Metadata = {
  title: 'Mot de passe oublié',
  description: 'Réinitialisez votre mot de passe KabiShop.',
  robots: { index: false, follow: false },
};

const TRUST = [
  { icon: Mail, label: 'Code envoyé par e-mail' },
  { icon: KeyRound, label: 'Code valide 15 min' },
  { icon: Lock, label: 'Connexion sécurisée' },
];

export default async function MotDePasseOubliePage() {
  const customer = await getCustomerSession();
  if (customer) {
    redirect('/compte');
  }

  return (
    <AuthSplitLayout
      panelTitle="Retrouvez l'accès à votre compte"
      panelSubtitle="Nous vous enverrons un code à 8 chiffres par e-mail pour définir un nouveau mot de passe."
      trustPoints={TRUST}
    >
      <Suspense fallback={<div className="skeleton h-56 w-full rounded-xl" />}>
        <ForgotPasswordForm />
      </Suspense>
    </AuthSplitLayout>
  );
}
