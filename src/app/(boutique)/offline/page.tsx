import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { WifiOff } from 'lucide-react';

export const metadata = {
  title: 'Hors ligne',
  robots: { index: false, follow: false },
};

export default function OfflinePage() {
  return (
    <div className="container-shop flex min-h-dvh flex-col items-center justify-center gap-6 py-16 text-center">
      <div className="rounded-full bg-primary/10 p-5 text-primary">
        <WifiOff className="h-10 w-10" aria-hidden />
      </div>
      <div className="max-w-md space-y-2">
        <h1 className="text-2xl font-black text-zinc-950">Vous êtes hors ligne</h1>
        <p className="text-sm text-zinc-500">
          Vérifiez votre connexion internet, puis réessayez. L&apos;application Love Piment& fonctionne
          mieux une fois installée sur votre téléphone.
        </p>
      </div>
      <Button asChild className="btn-primary rounded-full px-8">
        <Link href="/">Réessayer</Link>
      </Button>
    </div>
  );
}
