'use client';

import { useEffect, useState } from 'react';
import { Loader2, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

type Livreur = { id: string; nom: string; telephone: string; verifie: boolean; actif: boolean };

type Props = {
  orderId: string;
  courierId?: string | null;
  courierNom?: string | null;
  deliveryRunLabel?: string | null;
  disabled?: boolean;
  onAssigned?: () => void;
};

export function AdminAssignCourier({
  orderId,
  courierId,
  courierNom,
  deliveryRunLabel,
  disabled,
  onAssigned,
}: Props) {
  const [livreurs, setLivreurs] = useState<Livreur[]>([]);
  const [selected, setSelected] = useState(courierId ?? '');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch('/api/admin/livreurs')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        setLivreurs(
          (d?.livreurs ?? []).filter((l: Livreur) => l.actif),
        );
      })
      .finally(() => setLoading(false));
  }, []);

  const assigner = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/commandes/${orderId}/assigner-livreur`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courierId: selected }),
      });
      if (res.ok) onAssigned?.();
    } finally {
      setSaving(false);
    }
  };

  if (courierNom) {
    return (
      <div className="rounded-lg border border-blue-200 bg-blue-50/80 px-3 py-2 text-sm text-blue-900 space-y-1">
        <p className="flex items-center gap-2">
          <UserCheck className="h-4 w-4 shrink-0" />
          Livreur : <strong>{courierNom}</strong>
        </p>
        {deliveryRunLabel && (
          <p className="text-xs text-blue-800 pl-6">Tournée : {deliveryRunLabel}</p>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50/60 p-3 space-y-2">
      <p className="text-xs font-bold uppercase tracking-wide text-blue-900">Affecter un livreur</p>
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin text-blue-700" />
      ) : (
        <div className="flex flex-wrap gap-2">
          <select
            className="input-shop text-sm flex-1 min-w-[160px]"
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            disabled={disabled || saving}
          >
            <option value="">Choisir un livreur…</option>
            {livreurs.map((l) => (
              <option key={l.id} value={l.id}>
                {l.nom} {l.verifie ? '✓' : ''} — {l.telephone}
              </option>
            ))}
          </select>
          <Button
            type="button"
            size="sm"
            disabled={disabled || saving || !selected}
            onClick={assigner}
            className="rounded-full bg-blue-800 hover:bg-blue-900 text-white h-9"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Assigner'}
          </Button>
        </div>
      )}
    </div>
  );
}
