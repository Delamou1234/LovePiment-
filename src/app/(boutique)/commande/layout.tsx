import { redirect } from 'next/navigation';
import { redirectUrlApresSessionExpiree } from '@/shared/lib/auth/stale-session';
import { getCustomerSession } from '@/shared/lib/auth/session';

export default async function CommandeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const customer = await getCustomerSession();
  if (!customer) {
    redirect(redirectUrlApresSessionExpiree('/commande'));
  }
  return children;
}
