'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { BadgeCheck, Loader2, MessageSquare, RefreshCw, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { AvisAdmin } from '@/modules/avis/types';

export default function AdminAvisPage() {
  const [avis, setAvis] = useState<AvisAdmin[]>([]);
  const [filtre, setFiltre] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const url = filtre ? `/api/admin/avis?statut=${filtre}` : '/api/admin/avis';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setAvis(data.avis ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, [filtre]);

  useEffect(() => {
    load();
  }, [load]);

  const moderer = async (id: string, statut: 'APPROUVE' | 'REFUSE') => {
    await fetch('/api/admin/avis', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, statut }),
    });
    await load();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 flex items-center gap-2">
            <MessageSquare className="h-6 w-6" />
            Avis & notations
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Modération des avis produits — achats vérifiés automatiquement.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </div>

      <div className="flex gap-2">
        {[
          { id: '', label: 'Tous' },
          { id: 'APPROUVE', label: 'Approuvés' },
          { id: 'REFUSE', label: 'Refusés' },
        ].map(({ id, label }) => (
          <button
            key={id || 'all'}
            type="button"
            onClick={() => setFiltre(id)}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${
              filtre === id ? 'bg-[#4a5240] text-white' : 'bg-white border border-zinc-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
        </div>
      ) : avis.length === 0 ? (
        <p className="text-sm text-zinc-500 text-center py-12">Aucun avis.</p>
      ) : (
        <div className="space-y-4">
          {avis.map((a) => (
            <div key={a.id} className="rounded-xl border border-zinc-200 bg-white p-4 space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <Link
                    href={`/produits/${a.productSlug}`}
                    className="font-bold text-zinc-900 hover:text-[#4a5240]"
                  >
                    {a.productNom}
                  </Link>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    {a.clientNom} · {a.clientVille} ·{' '}
                    {new Intl.DateTimeFormat('fr-FR').format(new Date(a.createdAt))}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${i < a.note ? 'fill-amber-400 text-amber-400' : 'text-zinc-300'}`}
                      />
                    ))}
                  </div>
                  {a.achatVerifie && (
                    <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-700">
                      <BadgeCheck className="h-3 w-3" />
                      Vérifié
                    </span>
                  )}
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      a.statut === 'APPROUVE'
                        ? 'bg-emerald-50 text-emerald-700'
                        : a.statut === 'REFUSE'
                          ? 'bg-red-50 text-red-700'
                          : 'bg-amber-50 text-amber-700'
                    }`}
                  >
                    {a.statut}
                  </span>
                </div>
              </div>
              <p className="text-sm text-zinc-600">{a.commentaire}</p>
              {a.photos.length > 0 && (
                <div className="flex gap-2">
                  {a.photos.map((url) => (
                    <div key={url} className="relative h-16 w-16 rounded-lg overflow-hidden border">
                      <Image src={url} alt="" fill className="object-cover" unoptimized />
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-2 pt-1">
                {a.statut !== 'APPROUVE' && (
                  <Button size="sm" variant="outline" onClick={() => moderer(a.id, 'APPROUVE')}>
                    Approuver
                  </Button>
                )}
                {a.statut !== 'REFUSE' && (
                  <Button size="sm" variant="outline" onClick={() => moderer(a.id, 'REFUSE')}>
                    Refuser
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
