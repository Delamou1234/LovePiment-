'use client';

import { useCallback, useEffect, useState } from 'react';
import { Loader2, RefreshCw, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';

type Client = {
  id: string;
  email: string;
  nom: string;
  telephone: string | null;
  viaGoogle: boolean;
  commandes: number;
  montantTotal: number;
  derniereCommande: string | null;
  inscritLe: string;
};

export default function AdminClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/clients');
      if (res.ok) {
        const data = await res.json();
        setClients(data.clients ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 flex items-center gap-2">
            <Users className="h-6 w-6" />
            Gestion des clients
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Comptes inscrits en base — avec historique de commandes liées.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
        </div>
      ) : (
        <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden overflow-x-auto">
          <table className="w-full text-sm min-w-[800px]">
            <thead className="bg-zinc-50 text-left text-xs uppercase text-zinc-500">
              <tr>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">E-mail</th>
                <th className="px-4 py-3">Téléphone</th>
                <th className="px-4 py-3">Commandes</th>
                <th className="px-4 py-3">Total dépensé</th>
                <th className="px-4 py-3">Inscription</th>
                <th className="px-4 py-3">Dernière commande</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {clients.map((c) => (
                <tr key={c.id} className="hover:bg-zinc-50/50">
                  <td className="px-4 py-3 font-medium">
                    {c.nom}
                    {c.viaGoogle && (
                      <span className="ml-2 text-[10px] font-semibold uppercase text-zinc-400">
                        Google
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-zinc-600">{c.email}</td>
                  <td className="px-4 py-3 text-zinc-500">{c.telephone ?? '—'}</td>
                  <td className="px-4 py-3">{c.commandes}</td>
                  <td className="px-4 py-3 font-medium">
                    {c.montantTotal.toLocaleString('fr-FR')} GN
                  </td>
                  <td className="px-4 py-3 text-zinc-500 text-xs">
                    {new Intl.DateTimeFormat('fr-FR', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    }).format(new Date(c.inscritLe))}
                  </td>
                  <td className="px-4 py-3 text-zinc-500 text-xs">
                    {c.derniereCommande
                      ? new Intl.DateTimeFormat('fr-FR', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        }).format(new Date(c.derniereCommande))
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {clients.length === 0 && (
            <p className="text-center text-sm text-zinc-400 py-12">Aucun client inscrit pour le moment.</p>
          )}
        </div>
      )}
    </div>
  );
}
