'use client';

import { useState } from 'react';
import { Loader2, StickyNote } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function AdminOrderNotesField({
  orderId,
  notesAdmin,
  onSaved,
}: {
  orderId: string;
  notesAdmin?: string | null;
  onSaved: (notes: string | null) => void;
}) {
  const [value, setValue] = useState(notesAdmin ?? '');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/commandes/${orderId}/notes`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notesAdmin: value.trim() || null }),
      });
      const data = await res.json();
      if (res.ok) onSaved(data.notesAdmin ?? null);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 space-y-2">
      <p className="text-xs font-semibold text-zinc-600 flex items-center gap-1.5">
        <StickyNote className="h-3.5 w-3.5" />
        Note interne (équipe)
      </p>
      <textarea
        className="input-shop text-sm min-h-[72px] resize-y"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Ex: client fragile, appeler avant livraison…"
      />
      <Button type="button" size="sm" variant="outline" disabled={saving} onClick={() => void save()}>
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Enregistrer la note'}
      </Button>
    </div>
  );
}
