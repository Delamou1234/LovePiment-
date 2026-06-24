'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function CourierLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/courier/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? 'Connexion impossible');
        return;
      }
      window.location.assign(data.redirect ?? '/livreur');
    } catch {
      setError('Erreur réseau');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4 max-w-md mx-auto">
      <div className="text-center mb-6">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-olive text-white mb-3">
          <Truck className="h-6 w-6" />
        </div>
        <h1 className="text-xl font-bold text-zinc-900">Espace livreur</h1>
        <p className="text-sm text-zinc-500 mt-1">Connectez-vous pour voir vos livraisons</p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <input
        type="email"
        required
        placeholder="E-mail"
        className="input-shop w-full"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        required
        placeholder="Mot de passe"
        className="input-shop w-full"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <Button type="submit" disabled={loading} className="w-full rounded-full bg-olive hover:bg-olive-dark">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Se connecter'}
      </Button>
    </form>
  );
}
