import { redirect } from 'next/navigation';
import { customerAuthRepository } from '@/modules/auth/repository/customer-auth.repository';
import { isValidCustomerSession } from '@/shared/lib/auth/customer-session';
import { getCustomerSession } from '@/shared/lib/auth/session';
import { BoutiqueProviders } from '@/app/(boutique)/BoutiqueProviders';

export default async function CompteShellLayout({ children }: { children: React.ReactNode }) {
  const customer = await getCustomerSession();
  if (!isValidCustomerSession(customer)) {
    redirect('/connexion?redirect=/compte');
  }

  const row = await customerAuthRepository.trouverParId(customer.id);
  if (!row) {
    redirect('/connexion?redirect=/compte&error=session_expired');
  }

  return (
    <BoutiqueProviders>
      <div className="h-screen overflow-hidden bg-cream">{children}</div>
    </BoutiqueProviders>
  );
}
