'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ExternalLink, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ADMIN_BTN_PRIMARY } from '@/modules/admin/components/admin-ui';

const ENGIN: Record<string, string> = {
  MOTO: 'Moto',
  VOITURE: 'Voiture',
  VELO: 'Vélo',
  AUTRE: 'Autre',
};

type Livreur = {
  id: string;
  nom: string;
  email: string;
  telephone: string;
  typeEngin: string;
  commune: string | null;
  actif: boolean;
  verifie: boolean;
  commandesEnCours: number;
};

export function AdminLivreursPanel() {
  const [livreurs, setLivreurs] = useState<Livreur[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/livreurs');
      if (res.ok) {
        const data = await res.json();
        setLivreurs(data.livreurs ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-zinc-500">
          Livreurs enregistrés — création de compte et cartes depuis la page dédiée.
        </p>
        <Link href="/admin/livreurs">
          <Button type="button" className={ADMIN_BTN_PRIMARY}>
            <ExternalLink className="h-4 w-4" />
            Gestion complète
          </Button>
        </Link>
      </div>

      <div className="admin-marketing-table-card">
        {loading ? (
          <div className="admin-marketing-empty">
            <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
          </div>
        ) : livreurs.length === 0 ? (
          <p className="admin-marketing-empty-text">Aucun livreur enregistré.</p>
        ) : (
          <div className="admin-marketing-table-wrap">
            <table className="admin-marketing-table">
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Contact</th>
                  <th>Véhicule</th>
                  <th>Zone</th>
                  <th>Livraisons</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {livreurs.map((l) => (
                  <tr key={l.id}>
                    <td className="font-semibold text-zinc-900">{l.nom}</td>
                    <td>
                      <p className="text-zinc-700">{l.email}</p>
                      <p className="text-xs text-zinc-500">{l.telephone}</p>
                    </td>
                    <td>{ENGIN[l.typeEngin] ?? l.typeEngin}</td>
                    <td>{l.commune ?? '—'}</td>
                    <td>{l.commandesEnCours} en cours</td>
                    <td>
                      <div className="flex flex-wrap gap-1">
                        <span
                          className={`admin-marketing-badge ${l.actif ? 'is-active' : 'is-inactive'}`}
                        >
                          {l.actif ? 'Actif' : 'Inactif'}
                        </span>
                        <span
                          className={`admin-marketing-badge ${l.verifie ? 'is-active' : 'is-inactive'}`}
                        >
                          {l.verifie ? 'Vérifié' : 'Non vérifié'}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
