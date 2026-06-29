import { redirect } from 'next/navigation';
import { redirectUrlApresSessionExpiree } from '@/shared/lib/auth/stale-session';
import { getCustomerSessionWithCourierFallback } from '@/shared/lib/auth/customer-from-courier';
import { isValidCustomerSession } from '@/shared/lib/auth/customer-session';

export default async function CommandeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const customer = await getCustomerSessionWithCourierFallback();
  if (!isValidCustomerSession(customer)) {
    redirect(redirectUrlApresSessionExpiree('/commande'));
  }
  return children;
}
