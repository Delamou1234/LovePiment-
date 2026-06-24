'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRunAfterMount } from '@/shared/hooks/useRunAfterMount';
import Link from 'next/link';
import { Boxes, Loader2 } from 'lucide-react';
import { STOCK_FAIBLE_SEUIL } from '@/modules/admin/lib/stock-threshold';
import { ADMIN_TOPBAR_BADGE, adminTopbarQuick } from '../admin-ui';
import type { StockAlerte } from '@/modules/admin/services/stock-alert.service';

type Props = {
  count: number;
};

function varianteLabel(a: StockAlerte) {
  return [a.capacite, a.taille, a.couleur].filter(Boolean).join(' · ') || 'Standard';
}

export function AdminStockAlertsMenu({ count }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alertes, setAlertes] = useState<StockAlerte[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  const loadAlertes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/stocks/alertes', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setAlertes(data.alertes ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useRunAfterMount(() => {
    if (!open) return;
    void loadAlertes();
  }, [open, loadAlertes]);

  if (count <= 0) return null;

  const badge = count > 99 ? '99+' : String(count);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`${adminTopbarQuick()} admin-topbar-stock-alert`}
        title={`${count} variante(s) en stock faible (≤ ${STOCK_FAIBLE_SEUIL})`}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={`Alertes stock : ${badge} variante(s) en stock faible`}
      >
        <Boxes className="h-4 w-4" strokeWidth={1.75} />
        <span className={ADMIN_TOPBAR_BADGE}>{badge}</span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-80 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-[0_12px_40px_rgba(0,0,0,0.1)] animate-fadeIn"
        >
          <div className="border-b border-zinc-100 bg-amber-50 px-4 py-3">
            <p className="text-sm font-semibold text-amber-900">Stock faible</p>
            <p className="text-[11px] text-amber-800/80">
              {count} variante{count > 1 ? 's' : ''} à ≤ {STOCK_FAIBLE_SEUIL} unité
              {STOCK_FAIBLE_SEUIL > 1 ? 's' : ''}
            </p>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-8 text-sm text-zinc-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Chargement…
              </div>
            ) : alertes.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-zinc-500">Aucune alerte.</p>
            ) : (
              <ul className="divide-y divide-zinc-100">
                {alertes.map((a) => (
                  <li key={a.id}>
                    <Link
                      href={`/admin/stocks?faible=1#variant-${a.id}`}
                      role="menuitem"
                      onClick={() => setOpen(false)}
                      className="block px-4 py-3 hover:bg-amber-50/60 transition"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="truncate text-sm font-medium text-zinc-900">
                          {a.produit.nom}
                        </p>
                        <span
                          className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                            a.stock === 0
                              ? 'bg-red-100 text-red-700'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {a.stock}
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-xs text-zinc-500">{varianteLabel(a)}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="border-t border-zinc-100 bg-zinc-50 px-4 py-2.5">
            <Link
              href="/admin/stocks?faible=1"
              onClick={() => setOpen(false)}
              className="text-[11px] font-semibold text-[#e91e8c] hover:text-[#be185d]"
            >
              Gérer tous les stocks →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
