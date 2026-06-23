import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Espace livreur',
  robots: { index: false, follow: false },
};

export default function LivreurRootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
