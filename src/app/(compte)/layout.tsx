import { redirect } from 'next/navigation';
import { customerAuthRepository } from '@/modules/auth/repository/customer-auth.repository';
import { isValidCustomerSession } from '@/shared/lib/auth/customer-session';
import { redirectUrlApresSessionExpiree } from '@/shared/lib/auth/stale-session';
import { getCustomerSessionWithCourierFallback } from '@/shared/lib/auth/customer-from-courier';
import { BoutiqueProviders } from '@/app/(boutique)/BoutiqueProviders';

export default async function CompteShellLayout({ children }: { children: React.ReactNode }) {
  const customer = await getCustomerSessionWithCourierFallback();
  if (!isValidCustomerSession(customer)) {
    redirect(redirectUrlApresSessionExpiree('/compte'));
  }

  const row = await customerAuthRepository.trouverParId(customer.id);
  if (!row) {
    redirect(redirectUrlApresSessionExpiree('/compte'));
  }

  return (
    <BoutiqueProviders>
      <div className="h-dvh overflow-hidden bg-cream">{children}</div>
    </BoutiqueProviders>
  );
}
