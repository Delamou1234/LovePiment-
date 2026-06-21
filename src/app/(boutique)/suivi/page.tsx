'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function SuiviRecherchePage() {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const value = token.trim();
    if (!value) {
      setError('Entrez votre code de suivi.');
      return;
    }

    const res = await fetch(`/api/suivi/${encodeURIComponent(value)}`);
    if (!res.ok) {
      setError('Code de suivi introuvable. Vérifiez votre e-mail de confirmation.');
      return;
    }
    router.push(`/suivi/${value}`);
  };

  return (
    <div className="container-kabishop py-12 max-w-lg animate-fadeIn">
      <div className="flex items-center gap-1.5 text-xs text-zinc-500 mb-6">
        <Link href="/" className="hover:text-zinc-900 transition font-medium">
          Accueil
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-zinc-800 font-bold">Suivi de commande</span>
      </div>

      <div className="rounded-2xl border border-[#ebe4d8] bg-white p-8 shadow-sm">
        <h1 className="font-serif text-2xl font-bold text-zinc-900 mb-2">
          Suivre ma commande
        </h1>
        <p className="text-sm text-zinc-500 mb-6">
          Entrez le code de suivi reçu après votre commande. Le statut se met à jour en temps réel.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="token" className="text-xs font-bold uppercase text-zinc-500 tracking-wider">
              Code de suivi
            </label>
            <div className="relative mt-1.5">
              <input
                id="token"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Ex: clxx…"
                className="input-kabishop pr-10"
              />
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            </div>
          </div>
          {error && <p className="text-xs font-medium text-red-500">{error}</p>}
          <Button type="submit" className="btn-primary w-full rounded-full py-5 font-bold">
            Voir le suivi
          </Button>
        </form>
      </div>
    </div>
  );
}
