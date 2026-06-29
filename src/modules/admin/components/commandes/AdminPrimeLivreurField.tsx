'use client';

import { useState } from 'react';
import { Coins, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

type Props = {
  orderId: string;
  primeLivreurGn: number | null | undefined;
  disabled?: boolean;
  onSaved: (prime: number | null) => void;
};

export function AdminPrimeLivreurField({
  orderId,
  primeLivreurGn,
  disabled,
  onSaved,
}: Props) {
  const [value, setValue] = useState(
    primeLivreurGn != null ? String(primeLivreurGn) : '',
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const enregistrer = async () => {
    setSaving(true);
    setError(null);
    const raw = value.trim();
    const primeLivreurGn =
      raw === '' ? null : Number(raw.replace(/\s/g, ''));
    if (primeLivreurGn != null && (!Number.isFinite(primeLivreurGn) || primeLivreurGn < 0)) {
      setError('Montant invalide');
      setSaving(false);
      return;
    }
    try {
      const res = await fetch(`/api/admin/commandes/${orderId}/prime-livreur`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ primeLivreurGn }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((data as { message?: string }).message ?? 'Erreur');
        return;
      }
      onSaved((data as { primeLivreurGn?: number | null }).primeLivreurGn ?? null);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-xl border border-olive/20 bg-olive/5 p-3 space-y-2">
      <p className="text-xs font-semibold text-zinc-700 flex items-center gap-1.5">
        <Coins className="h-3.5 w-3.5 text-olive" />
        Prime livreur (GN)
      </p>
      <div className="flex flex-wrap gap-2">
        <input
          type="text"
          inputMode="numeric"
          placeholder="Ex. 5000"
          className="input-shop text-sm flex-1 min-w-[120px]"
          value={value}
          disabled={disabled || saving}
          onChange={(e) => setValue(e.target.value)}
        />
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={disabled || saving}
          onClick={() => void enregistrer()}
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Enregistrer'}
        </Button>
      </div>
      {error && (
        <p className="text-xs text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
