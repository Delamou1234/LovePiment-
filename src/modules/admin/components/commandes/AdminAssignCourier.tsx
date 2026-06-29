'use client';

import { Send, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

type Props = {
  courierNom?: string | null;
  disabled?: boolean;
  onAssign?: () => void;
};

export function AdminAssignCourier({ courierNom, disabled, onAssign }: Props) {
  if (courierNom) {
    return (
      <div className="rounded-lg border border-emerald-200 bg-emerald-50/80 px-3 py-2 text-sm text-emerald-900">
        <p className="flex items-center gap-2">
          <UserCheck className="h-4 w-4 shrink-0" />
          Envoyée à <strong>{courierNom}</strong>
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-olive/25 bg-olive/5 p-3">
      <p className="text-xs text-zinc-600 mb-2">
        Cette commande n&apos;a pas encore de livreur. Cochez-la dans le tableau ou cliquez ci-dessous.
      </p>
      <Button
        type="button"
        size="sm"
        disabled={disabled}
        className="w-full sm:w-auto rounded-full bg-olive hover:bg-olive-dark text-white"
        onClick={onAssign}
      >
        <Send className="h-4 w-4 mr-1.5" />
        Choisir le livreur
      </Button>
    </div>
  );
}
