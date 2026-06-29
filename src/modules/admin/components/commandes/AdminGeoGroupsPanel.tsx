'use client';

import { useRunAfterMount } from '@/shared/hooks/useRunAfterMount';
import { useCallback, useState } from 'react';
import { AlertCircle, Loader2, MapPin, RefreshCw, Route, Sparkles } from 'lucide-react';
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

function GeoSkeleton() {
  return (
    <div className="admin-geo-skeleton-grid" aria-hidden>
      {[1, 2].map((i) => (
        <div key={i} className="admin-geo-skeleton-card" />
      ))}
    </div>
  );
}

export function AdminGeoGroupsPanel({ onSelectGroup, refreshKey }: Props) {
  const [groupes, setGroupes] = useState<GeoGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [geocoding, setGeocoding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rayonKm, setRayonKm] = useState('2.5');
  const [stats, setStats] = useState({ total: 0, multi: 0, nonRegroupees: 0 });

  const load = useCallback(
    async (opts?: { geocoder?: boolean }) => {
      const withGeocode = opts?.geocoder ?? false;
      if (withGeocode) setGeocoding(true);
      else setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/admin/commandes/regroupement-geo?rayonKm=${encodeURIComponent(rayonKm)}&geocoder=${withGeocode ? 'true' : 'false'}`,
        );
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError((data as { message?: string }).message ?? 'Regroupement impossible.');
          setGroupes([]);
          return;
        }
        setGroupes(data.groupesMulti ?? data.groupes ?? []);
        setStats({
          total: data.totalEligibles ?? 0,
          multi: (data.groupesMulti ?? []).length,
          nonRegroupees: data.nonRegroupees ?? 0,
        });
      } catch {
        setError('Connexion impossible — réessayez.');
        setGroupes([]);
      } finally {
        setLoading(false);
        setGeocoding(false);
      }
    },
    [rayonKm],
  );

  useRunAfterMount(() => void load(), [load, refreshKey]);

  return (
    <section className={`admin-livraison-card ${ADMIN_CARD} ${ADMIN_CARD_PAD} space-y-4`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex gap-3 min-w-0">
          <div className="admin-livraison-card-icon shrink-0" aria-hidden>
            <MapPin className="h-4 w-4" strokeWidth={1.75} />
          </div>
          <div className="min-w-0">
            <h2 className="admin-livraison-card-title">Regroupement géographique</h2>
            <p className="admin-livraison-card-desc">
              Commandes non assignées regroupées par proximité GPS ({rayonKm} km) ou par commune.
              Sélectionnez un groupe pour créer une tournée.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="admin-livraison-rayon">
            <span>Rayon</span>
            <select
              className="admin-form-select admin-form-select--sm"
              value={rayonKm}
              onChange={(e) => setRayonKm(e.target.value)}
              disabled={loading || geocoding}
            >
              <option value="1.5">1,5 km</option>
              <option value="2.5">2,5 km</option>
              <option value="4">4 km</option>
              <option value="6">6 km</option>
            </select>
          </label>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => void load()}
            disabled={loading || geocoding}
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => void load({ geocoder: true })}
            disabled={loading || geocoding}
            title="Tente de géocoder les adresses sans coordonnées GPS"
          >
            {geocoding ? (
              <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5 mr-1" />
            )}
            Géocoder
          </Button>
        </div>
      </div>

      {!loading && !error && (
        <div className="admin-geo-stats">
          <span className="admin-geo-stat">
            <strong>{stats.total}</strong> en attente
          </span>
          <span className="admin-geo-stat">
            <strong>{stats.multi}</strong> groupe{stats.multi > 1 ? 's' : ''} multi-commandes
          </span>
          {stats.nonRegroupees > 0 && (
            <span className="admin-geo-stat is-muted">
              {stats.nonRegroupees} isolée{stats.nonRegroupees > 1 ? 's' : ''}
            </span>
          )}
        </div>
      )}

      {error && (
        <div className="admin-livraison-error" role="alert">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <p>{error}</p>
          <Button type="button" size="sm" variant="outline" onClick={() => void load()}>
            Réessayer
          </Button>
        </div>
      )}

      {loading ? (
        <GeoSkeleton />
      ) : !error && groupes.length === 0 ? (
        <div className="admin-livraison-empty">
          {stats.total === 0 ? (
            <>
              <p>Aucune commande en attente d&apos;assignation.</p>
              <p className="admin-livraison-empty-hint">
                Les nouvelles commandes payées apparaîtront ici pour création de tournées.
              </p>
            </>
          ) : (
            <>
              <p>Pas de groupe de 2+ commandes proches.</p>
              <p className="admin-livraison-empty-hint">
                Élargissez le rayon, lancez le géocodage, ou assignez manuellement depuis le tableau.
              </p>
            </>
          )}
        </div>
      ) : (
        !error && (
          <div className="admin-geo-grid">
            {groupes.map((g) => (
              <article key={g.id} className="admin-geo-group">
                <div className="admin-geo-group-head">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-zinc-900 text-sm truncate">{g.label}</p>
                      <span
                        className={`admin-geo-badge${g.methode === 'gps' ? ' is-gps' : ''}`}
                      >
                        {g.methode === 'gps' ? 'GPS' : 'Commune'}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500 mt-1">
                      {g.commune} · {g.commandesCount} cmd ·{' '}
                      {g.montantTotal.toLocaleString('fr-FR')} GN
                      {g.methode === 'gps' && g.etendueKm != null && g.etendueKm > 0
                        ? ` · ~${(g.etendueKm * 1000).toFixed(0)} m`
                        : ''}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1.5 shrink-0">
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
                        href={googleMapsNavigationUrl(g.centroid, g.commune, 'Conakry')}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="admin-geo-map-link"
                      >
                        <Route className="h-3.5 w-3.5" />
                        Carte
                      </a>
                    )}
                  </div>
                </div>
                <ul className="admin-geo-orders">
                  {g.commandes.map((c) => (
                    <li key={c.id}>
                      <span className="truncate">
                        {c.clientNom} — {c.clientAdresse}
                      </span>
                      <span className="shrink-0 tabular-nums">
                        {c.montantTotal.toLocaleString('fr-FR')} GN
                      </span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        )
      )}
    </section>
  );
}
