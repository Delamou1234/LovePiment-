'use client';

import { useEffect, useState } from 'react';
import { Loader2, Package, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ADMIN_BTN_PRIMARY } from '@/modules/admin/components/admin-ui';

type Livreur = { id: string; nom: string; telephone: string; verifie: boolean; actif: boolean };

type Props = {
  selectedIds: string[];
  disabled?: boolean;
  onDone?: () => void;
  onClear?: () => void;
};

export function AdminBatchDelivery({
  selectedIds,
  disabled,
  onDone,
  onClear,
}: Props) {
  const [livreurs, setLivreurs] = useState<Livreur[]>([]);
  const [selected, setSelected] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch('/api/admin/livreurs')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        setLivreurs((d?.livreurs ?? []).filter((l: Livreur) => l.actif));
      })
      .finally(() => setLoading(false));
  }, []);

  if (selectedIds.length === 0) return null;

  const creerTournee = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const res = await fetch('/api/admin/livraisons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courierId: selected, orderIds: selectedIds }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.message ?? 'Impossible de créer la tournée.');
        return;
      }
      onClear?.();
      onDone?.();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="sticky bottom-4 z-20 rounded-2xl border border-olive/30 bg-white p-4 shadow-lg ring-1 ring-olive/10">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <p className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
          <Package className="h-4 w-4 text-olive" />
          {selectedIds.length} commande{selectedIds.length > 1 ? 's' : ''} sélectionnée
          {selectedIds.length > 1 ? 's' : ''} — une tournée
        </p>
        <div className="flex flex-wrap gap-2 items-center">
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin text-olive" />
          ) : (
            <select
              className="input-shop text-sm min-w-[180px]"
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
              disabled={disabled || saving}
            >
              <option value="">Livreur pour la tournée…</option>
              {livreurs.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.nom} {l.verifie ? '✓' : ''}
                </option>
              ))}
            </select>
          )}
          <Button
            type="button"
            size="sm"
            disabled={disabled || saving || !selected}
            onClick={creerTournee}
            className={ADMIN_BTN_PRIMARY}
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Truck className="h-4 w-4 mr-1" />
                Créer la tournée
              </>
            )}
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={onClear} disabled={saving}>
            Annuler
          </Button>
        </div>
      </div>
    </div>
  );
}
