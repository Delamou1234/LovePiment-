'use client';

import dynamic from 'next/dynamic';
import { PwaRegistrar } from '@/shared/components/pwa/PwaRegistrar';

const PwaInstallBanner = dynamic(
  () =>
    import('@/shared/components/pwa/PwaInstallBanner').then((m) => ({
      default: m.PwaInstallBanner,
    })),
  { ssr: false },
);

/** Enregistrement SW + proposition d'installation (boutique / compte client). */
export function PwaClientShell() {
  return (
    <>
      <PwaRegistrar />
      <PwaInstallBanner />
    </>
  );
}
