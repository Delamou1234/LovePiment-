'use client';

import { useRunAfterMount } from '@/shared/hooks/useRunAfterMount';
import { useCallback, useState } from 'react';
import { Loader2, Route } from 'lucide-react';
import { ADMIN_CARD, ADMIN_CARD_PAD } from '@/modules/admin/components/admin-ui';

type Tournee = {
  id: string;
  label: string | null;
  montantTotalGn: number | null;
  montantEspecesGn: number | null;
  courier: { nom: string } | null;
  commandes: { id: string; clientNom: string; montantTotal: number }[];
};

export function AdminTourneesMontants({ refreshKey }: { refreshKey?: number }) {
  const [tournees, setTournees] = useState<Tournee[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/livraisons');
      if (res.ok) {
        const data = await res.json();
        setTournees(data.tournees ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useRunAfterMount(() => void load(), [load, refreshKey]);

  return (
    <section className={`admin-livraison-card ${ADMIN_CARD} ${ADMIN_CARD_PAD} space-y-4`}>
      <div className="admin-livraison-card-head">
        <div className="admin-livraison-card-icon" aria-hidden>
          <Route className="h-4 w-4" strokeWidth={1.75} />
        </div>
        <div>
          <h2 className="admin-livraison-card-title">En cours chez les livreurs</h2>
          <p className="admin-livraison-card-desc">
            Récapitulatif automatique — rien à saisir manuellement.
          </p>
        </div>
        {!loading && <span className="admin-livraison-count">{tournees.length}</span>}
      </div>

      {loading ? (
        <div className="space-y-3" aria-busy>
          {[1, 2].map((i) => (
            <div key={i} className="admin-geo-skeleton-card h-16" />
          ))}
        </div>
      ) : tournees.length === 0 ? (
        <div className="admin-livraison-empty">
          <p>Aucune livraison en cours.</p>
          <p className="admin-livraison-empty-hint">
            Les commandes envoyées à un livreur apparaîtront ici.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {tournees.map((t) => {
            const calcTotal =
              t.montantTotalGn ??
              t.commandes.reduce((s, c) => s + c.montantTotal, 0);
            const especes = t.montantEspecesGn ?? 0;
            return (
              <div key={t.id} className="admin-tournee-row admin-tournee-row--readonly">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-zinc-900 text-sm">
                    {t.courier?.nom ?? 'Livreur'}
                    <span className="font-normal text-zinc-500">
                      {' '}
                      · {t.commandes.length} commande{t.commandes.length > 1 ? 's' : ''}
                    </span>
                  </p>
                  <p className="text-xs text-zinc-500 mt-0.5 truncate">
                    {t.commandes.map((c) => c.clientNom).join(', ')}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-zinc-900 tabular-nums">
                    {calcTotal.toLocaleString('fr-FR')} GN
                  </p>
                  {especes > 0 && (
                    <p className="text-[11px] text-amber-800 tabular-nums">
                      dont {especes.toLocaleString('fr-FR')} GN espèces
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
