'use client';

import { useRunAfterMount } from '@/shared/hooks/useRunAfterMount';
import { useCallback, useState } from 'react';
import { Loader2, MapPin, RefreshCw, Route } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ADMIN_CARD, ADMIN_CARD_PAD } from '@/modules/admin/components/admin-ui';
import { googleMapsNavigationUrl } from '@/shared/lib/geolocation/maps-links';

type GeoGroup = {
  id: string;
  label: string;
  methode: 'gps' | 'commune';
  commune: string;
  orderIds: string[];
  commandesCount: number;
  montantTotal: number;
  etendueKm: number | null;
  centroid: { latitude: number; longitude: number } | null;
  commandes: {
    id: string;
    clientNom: string;
    clientAdresse: string;
    montantTotal: number;
  }[];
};

type Props = {
  onSelectGroup: (orderIds: string[]) => void;
  refreshKey?: number;
};

export function AdminGeoGroupsPanel({ onSelectGroup, refreshKey }: Props) {
  const [groupes, setGroupes] = useState<GeoGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [rayonKm, setRayonKm] = useState('2.5');
  const [stats, setStats] = useState({ total: 0, multi: 0 });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/commandes/regroupement-geo?rayonKm=${encodeURIComponent(rayonKm)}`,
      );
      if (res.ok) {
        const data = await res.json();
        setGroupes(data.groupesMulti ?? data.groupes ?? []);
        setStats({
          total: data.totalEligibles ?? 0,
          multi: (data.groupesMulti ?? []).length,
        });
      }
    } finally {
      setLoading(false);
    }
  }, [rayonKm]);

  useRunAfterMount(() => void load(), [load, refreshKey]);

  return (
    <section className={`${ADMIN_CARD} ${ADMIN_CARD_PAD} space-y-4`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold text-zinc-900 flex items-center gap-2">
            <MapPin className="h-4 w-4 text-olive" />
            Regroupement géographique
          </h2>
          <p className="text-xs text-zinc-500 mt-1">
            Commandes non assignées regroupées par proximité GPS ({rayonKm} km) ou par commune.
            Sélectionnez un groupe puis créez une tournée.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-xs text-zinc-600 flex items-center gap-1">
            Rayon
            <select
              className="input-shop text-xs h-8 py-0"
              value={rayonKm}
              onChange={(e) => setRayonKm(e.target.value)}
            >
              <option value="1.5">1,5 km</option>
              <option value="2.5">2,5 km</option>
              <option value="4">4 km</option>
              <option value="6">6 km</option>
            </select>
          </label>
          <Button type="button" size="sm" variant="outline" onClick={load} disabled={loading}>
            <RefreshCw className={`h-3.5 w-3.5 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-olive" />
        </div>
      ) : groupes.length === 0 ? (
        <p className="text-sm text-zinc-500 py-4">
          {stats.total === 0
            ? 'Aucune commande en attente d\'assignation.'
            : 'Pas de groupe de 2+ commandes proches — élargissez le rayon ou assignez manuellement.'}
        </p>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {groupes.map((g) => (
            <div
              key={g.id}
              className="rounded-xl border border-olive/20 bg-olive-light/20 p-4 space-y-3"
            >
              <div className="flex flex-wrap justify-between gap-2">
                <div>
                  <p className="font-semibold text-zinc-900 text-sm">{g.label}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    {g.commune} · {g.commandesCount} commande{g.commandesCount > 1 ? 's' : ''} ·{' '}
                    {g.montantTotal.toLocaleString('fr-FR')} GN
                    {g.methode === 'gps' && g.etendueKm != null && g.etendueKm > 0
                      ? ` · étendue ~${(g.etendueKm * 1000).toFixed(0)} m`
                      : ''}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <Button
                    type="button"
                    size="sm"
                    className="h-8 text-xs bg-olive hover:bg-olive-dark text-white"
                    onClick={() => onSelectGroup(g.orderIds)}
                  >
                    Sélectionner
                  </Button>
                  {g.centroid && (
                    <a
                      href={googleMapsNavigationUrl(
                        g.centroid,
                        g.commune,
                        'Conakry',
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center h-8 px-3 rounded-md border border-zinc-200 bg-white text-xs font-medium hover:bg-zinc-50"
                    >
                      <Route className="h-3.5 w-3.5 mr-1" />
                      Carte
                    </a>
                  )}
                </div>
              </div>
              <ul className="text-xs text-zinc-600 space-y-1 max-h-28 overflow-y-auto">
                {g.commandes.map((c) => (
                  <li key={c.id} className="flex justify-between gap-2 border-b border-zinc-100/80 pb-1">
                    <span className="truncate">
                      {c.clientNom} — {c.clientAdresse}
                    </span>
                    <span className="shrink-0 text-zinc-400">
                      {c.montantTotal.toLocaleString('fr-FR')} GN
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
