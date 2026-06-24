'use client';

import Link from 'next/link';
import { AlertTriangle, X } from 'lucide-react';
import { useState } from 'react';
import { STOCK_FAIBLE_SEUIL } from '@/modules/admin/lib/stock-threshold';

type Props = {
  count: number;
};

export function AdminStockAlertBanner({ count }: Props) {
  const [dismissed, setDismissed] = useState(false);
  const [prevCount, setPrevCount] = useState(count);

  if (count !== prevCount) {
    if (count > prevCount) setDismissed(false);
    setPrevCount(count);
  }

  if (count <= 0 || dismissed) return null;

  return (
    <div className="admin-stock-banner" role="alert">
      <div className="admin-stock-banner-inner">
        <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" strokeWidth={1.75} />
        <p className="flex-1 text-sm text-amber-950">
          <strong>{count}</strong> variante{count > 1 ? 's' : ''} en stock faible (≤{' '}
          {STOCK_FAIBLE_SEUIL} unité{STOCK_FAIBLE_SEUIL > 1 ? 's' : ''}).{' '}
          <Link href="/admin/stocks?faible=1" className="font-semibold underline underline-offset-2">
            Voir les stocks
          </Link>
        </p>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="admin-stock-banner-close"
          aria-label="Masquer l'alerte"
        >
          <X className="h-4 w-4" strokeWidth={1.75} />
        </button>
      </div>
    </div>
  );
}
