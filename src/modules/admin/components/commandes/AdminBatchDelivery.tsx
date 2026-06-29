'use client';

import { Package, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';

type Props = {
  selectedIds: string[];
  onAssign: () => void;
  onClear?: () => void;
};

export function AdminBatchDelivery({ selectedIds, onAssign, onClear }: Props) {
  if (selectedIds.length === 0) return null;

  const plusieurs = selectedIds.length > 1;

  return (
    <div className="sticky bottom-4 z-20 rounded-2xl border border-olive/30 bg-white p-4 shadow-lg ring-1 ring-olive/10">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <p className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
          <Package className="h-4 w-4 text-olive" />
          {selectedIds.length} commande{plusieurs ? 's' : ''} sélectionnée{plusieurs ? 's' : ''}
        </p>
        <div className="flex flex-wrap gap-2 items-center">
          <Button
            type="button"
            size="sm"
            className="rounded-full bg-olive hover:bg-olive-dark text-white"
            onClick={onAssign}
          >
            <Truck className="h-4 w-4 mr-1" />
            Choisir le livreur
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={onClear}>
            Annuler la sélection
          </Button>
        </div>
      </div>
    </div>
  );
}
