import type { Metadata } from 'next';
import { getCachedAproposConfig } from '@/modules/marketing/lib/cached-queries';
import { storeSettingsService } from '@/modules/admin/services/store-settings.service';
import { AproposPageContent } from '@/shared/components/pages/AproposPageContent';

export async function generateMetadata(): Promise<Metadata> {
  const apropos = await getCachedAproposConfig();
  return {
    title: 'À propos — Love Piment&',
    description: apropos.metaDescription,
  };
}

export default async function AProposPage() {
  const [apropos, livraison] = await Promise.all([
    getCachedAproposConfig(),
    storeSettingsService.getLivraisonConfig(),
  ]);

  return <AproposPageContent apropos={apropos} livraison={livraison} />;
}
