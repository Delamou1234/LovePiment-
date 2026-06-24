'use client';

import { useCallback, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useIsClient } from '@/shared/hooks/useIsClient';
import { useRunAfterMount } from '@/shared/hooks/useRunAfterMount';
import Link from 'next/link';
import { AlertTriangle, Loader2, Package } from 'lucide-react';
import { STOCK_FAIBLE_SEUIL } from '@/modules/admin/lib/stock-threshold';
import type { StockAlerte } from '@/modules/admin/services/stock-alert.service';

const SESSION_KEY = 'lovepiment-admin-stock-modal';

type Props = {
  count: number;
};

function varianteLabel(a: StockAlerte) {
  return [a.capacite, a.taille, a.couleur].filter(Boolean).join(' · ') || 'Standard';
}

function groupAlertesByProduct(alertes: StockAlerte[]) {
  const map = new Map<
    string,
    { produit: StockAlerte['produit']; variantes: StockAlerte[]; stockMin: number }
  >();

  for (const a of alertes) {
    const existing = map.get(a.produit.id);
    if (existing) {
      existing.variantes.push(a);
      existing.stockMin = Math.min(existing.stockMin, a.stock);
    } else {
      map.set(a.produit.id, { produit: a.produit, variantes: [a], stockMin: a.stock });
    }
  }

  return [...map.values()].sort((a, b) => a.stockMin - b.stockMin);
}

export function AdminStockAlertModal({ count }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alertes, setAlertes] = useState<StockAlerte[]>([]);
  const mounted = useIsClient();
  const [prevCount, setPrevCount] = useState(count);

  const produitsAlertes = useMemo(() => groupAlertesByProduct(alertes), [alertes]);

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

  useRunAfterMount(() => {
    if (count <= 0) {
      setOpen(false);
      return;
    }

    if (count > prevCount) {
      sessionStorage.removeItem(SESSION_KEY);
    }
    setPrevCount(count);

    const dismissed = sessionStorage.getItem(SESSION_KEY);
    if (!dismissed) {
      setOpen(true);
      void loadAlertes();
    }
  }, [count, prevCount, loadAlertes]);

  const dismiss = () => {
    sessionStorage.setItem(SESSION_KEY, String(count));
    setOpen(false);
  };

  if (!mounted || !open || count <= 0) return null;

  const ruptures = alertes.filter((a) => a.stock === 0).length;

  return createPortal(
    <div className="confirm-dialog-root">
      <button
        type="button"
        className="confirm-dialog-backdrop"
        aria-label="Fermer"
        onClick={dismiss}
      />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="stock-alert-modal-title"
        aria-describedby="stock-alert-modal-desc"
        className="confirm-dialog-panel admin-stock-alert-modal"
      >
        <div className="confirm-dialog-icon-wrap">
          <div className="confirm-dialog-icon bg-amber-50 text-amber-600">
            <AlertTriangle className="h-5 w-5" strokeWidth={1.75} />
          </div>
        </div>

        <div className="confirm-dialog-content">
          <h2 id="stock-alert-modal-title" className="confirm-dialog-title">
            Ravitailler les stocks
          </h2>
          <p id="stock-alert-modal-desc" className="confirm-dialog-message">
            {count} variante{count > 1 ? 's' : ''} à {STOCK_FAIBLE_SEUIL} unité
            {STOCK_FAIBLE_SEUIL > 1 ? 's' : ''} ou moins.
            {ruptures > 0
              ? ` ${ruptures} en rupture — ces produits sont masqués côté client.`
              : ' Sans réapprovisionnement, vous risquez une pénurie.'}
          </p>

          <div className="admin-stock-alert-modal-list">
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-6 text-sm text-zinc-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Chargement…
              </div>
            ) : produitsAlertes.length === 0 ? (
              <p className="py-4 text-center text-sm text-zinc-500">Aucune alerte détaillée.</p>
            ) : (
              <ul className="admin-stock-alert-modal-items">
                {produitsAlertes.slice(0, 8).map(({ produit, variantes, stockMin }) => (
                  <li key={produit.id} className="admin-stock-alert-modal-item">
                    <Package className="h-4 w-4 shrink-0 text-amber-600" strokeWidth={1.75} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-zinc-900">{produit.nom}</p>
                      <p className="truncate text-xs text-zinc-500">
                        {variantes.length > 1
                          ? `${variantes.length} variantes concernées`
                          : varianteLabel(variantes[0]!)}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        stockMin === 0
                          ? 'bg-red-100 text-red-700'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {stockMin === 0 ? 'Rupture' : `${stockMin} rest.`}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            {produitsAlertes.length > 8 && (
              <p className="mt-2 text-center text-xs text-zinc-500">
                + {produitsAlertes.length - 8} autre{produitsAlertes.length - 8 > 1 ? 's' : ''}{' '}
                produit{produitsAlertes.length - 8 > 1 ? 's' : ''}
              </p>
            )}
          </div>
        </div>

        <div className="confirm-dialog-actions">
          <button type="button" className="confirm-dialog-btn confirm-dialog-btn--cancel" onClick={dismiss}>
            Plus tard
          </button>
          <Link
            href="/admin/stocks?faible=1"
            className="confirm-dialog-btn confirm-dialog-btn--confirm text-center"
            onClick={dismiss}
          >
            Gérer les stocks
          </Link>
        </div>
      </div>
    </div>,
    document.body,
  );
}
