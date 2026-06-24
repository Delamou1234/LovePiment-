'use client';

import { useCallback, useEffect, useState } from 'react';
import { Loader2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
  const [drafts, setDrafts] = useState<Record<string, { total: string; especes: string }>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/livraisons');
      if (res.ok) {
        const data = await res.json();
        const list: Tournee[] = (data.tournees ?? []).map(
          (t: {
            id: string;
            label: string | null;
            montantTotalGn: number | null;
            montantEspecesGn: number | null;
            courier: { nom: string } | null;
            commandes: { id: string; clientNom: string; montantTotal: number }[];
          }) => ({
            id: t.id,
            label: t.label,
            montantTotalGn: t.montantTotalGn,
            montantEspecesGn: t.montantEspecesGn,
            courier: t.courier,
            commandes: t.commandes,
          }),
        );
        setTournees(list);
        const next: Record<string, { total: string; especes: string }> = {};
        for (const t of list) {
          const calcTotal = t.commandes.reduce((s, c) => s + c.montantTotal, 0);
          next[t.id] = {
            total: String(t.montantTotalGn ?? calcTotal),
            especes: String(t.montantEspecesGn ?? 0),
          };
        }
        setDrafts(next);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  const enregistrer = async (id: string) => {
    const draft = drafts[id];
    if (!draft) return;
    setSavingId(id);
    try {
      const res = await fetch(`/api/admin/livraisons/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          montantTotalGn: Number(draft.total),
          montantEspecesGn: Number(draft.especes),
        }),
      });
      if (res.ok) await load();
    } finally {
      setSavingId(null);
    }
  };

  if (loading) {
    return (
      <div className={`${ADMIN_CARD} ${ADMIN_CARD_PAD} flex justify-center py-8`}>
        <Loader2 className="h-6 w-6 animate-spin text-olive" />
      </div>
    );
  }

  if (tournees.length === 0) return null;

  return (
    <section className={`${ADMIN_CARD} ${ADMIN_CARD_PAD} space-y-4`}>
      <div>
        <h2 className="font-semibold text-zinc-900">Montants des tournées</h2>
        <p className="text-xs text-zinc-500 mt-1">
          Totaux visibles par le livreur (cumul par tournée). Détail par commande : ci-dessous.
        </p>
      </div>
      <div className="space-y-4">
        {tournees.map((t) => {
          const draft = drafts[t.id];
          const detailLigne = t.commandes
            .map((c) => `${c.clientNom} (${c.montantTotal.toLocaleString('fr-FR')} GN)`)
            .join(' · ');
          return (
            <div key={t.id} className="rounded-xl border border-zinc-100 bg-zinc-50/80 p-4 space-y-3">
              <div>
                <p className="font-medium text-zinc-900">{t.label ?? t.id.slice(0, 8)}</p>
                <p className="text-xs text-zinc-500">
                  {t.courier?.nom ?? '—'} · {t.commandes.length} commande(s)
                </p>
                <p className="text-xs text-zinc-400 mt-1">{detailLigne}</p>
              </div>
              <div className="grid gap-2 sm:grid-cols-3">
                <label className="text-xs text-zinc-600">
                  Total tournée (GN)
                  <input
                    className="input-shop mt-1 w-full"
                    value={draft?.total ?? ''}
                    onChange={(e) =>
                      setDrafts((d) => ({
                        ...d,
                        [t.id]: { ...d[t.id]!, total: e.target.value },
                      }))
                    }
                  />
                </label>
                <label className="text-xs text-zinc-600">
                  Espèces à encaisser (GN)
                  <input
                    className="input-shop mt-1 w-full"
                    value={draft?.especes ?? ''}
                    onChange={(e) =>
                      setDrafts((d) => ({
                        ...d,
                        [t.id]: { ...d[t.id]!, especes: e.target.value },
                      }))
                    }
                  />
                </label>
                <div className="flex items-end">
                  <Button
                    type="button"
                    size="sm"
                    className="w-full"
                    disabled={savingId === t.id}
                    onClick={() => enregistrer(t.id)}
                  >
                    {savingId === t.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-1" />
                        Enregistrer
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
