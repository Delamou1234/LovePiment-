import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { redirectUrlApresSessionExpiree } from '@/shared/lib/auth/stale-session';
import { getCourierSession } from '@/shared/lib/auth/session';

export const metadata: Metadata = {
  title: 'Espace livreur — Love Piment&',
  robots: { index: false, follow: false },
};

export default async function LivreurAppLayout({ children }: { children: React.ReactNode }) {
  const session = await getCourierSession();
  if (!session?.id) {
    redirect(redirectUrlApresSessionExpiree('/livreur'));
  }

  return <div className="h-dvh overflow-hidden bg-cream">{children}</div>;
}
