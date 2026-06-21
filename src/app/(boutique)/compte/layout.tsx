import { redirect } from 'next/navigation';
import { getCustomerSession } from '@/shared/lib/auth/session';

export default async function CompteLayout({ children }: { children: React.ReactNode }) {
  const customer = await getCustomerSession();
  if (!customer) {
    redirect('/connexion?redirect=/compte');
  }
  return children;
}
