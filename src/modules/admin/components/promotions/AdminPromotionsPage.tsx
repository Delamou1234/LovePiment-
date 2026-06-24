'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ExternalLink,
  Package,
  RefreshCw,
  Tag,
  Ticket,
  Zap,
} from 'lucide-react';
import { AdminPromoProductsSection } from './AdminPromoProductsSection';
import { AdminPromoCouponsSection } from './AdminPromoCouponsSection';
import { AdminPromoFlashSection } from './AdminPromoFlashSection';

export type PromoAdminTab = 'produits' | 'coupons' | 'flash';

const TABS: { id: PromoAdminTab; label: string; icon: typeof Package }[] = [
  { id: 'produits', label: 'Produits en promo', icon: Package },
  { id: 'coupons', label: 'Codes promo', icon: Ticket },
  { id: 'flash', label: 'Ventes flash', icon: Zap },
];

function parseTab(value: string | null): PromoAdminTab {
  if (value === 'coupons' || value === 'flash') return value;
  return 'produits';
}

export function AdminPromotionsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = searchParams.get('edit')
    ? 'produits'
    : parseTab(searchParams.get('tab'));
  const [refreshToken, setRefreshToken] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const selectTab = (next: PromoAdminTab) => {
    const params = new URLSearchParams(searchParams.toString());
    if (next === 'produits') {
      params.delete('tab');
    } else {
      params.set('tab', next);
    }
    const query = params.toString();
    router.replace(query ? `/admin/promotions?${query}` : '/admin/promotions', { scroll: false });
  };

  const refreshAll = useCallback(() => {
    setRefreshing(true);
    setRefreshToken((n) => n + 1);
    window.setTimeout(() => setRefreshing(false), 400);
  }, []);

  return (
    <div className="admin-marketing-page">
      <header className="admin-marketing-header">
        <div>
          <h1 className="admin-marketing-title">
            <Tag className="h-7 w-7 text-[#e91e8c]" strokeWidth={1.75} />
            Page Promotions
          </h1>
          <p className="admin-marketing-subtitle">
            Configurez tout le contenu affiché sur la page Promotions de la boutique : prix promo,
            codes de réduction et ventes flash.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/promos"
            target="_blank"
            className="admin-marketing-refresh"
            title="Prévisualiser la page boutique"
          >
            <ExternalLink className="h-4 w-4" />
            Voir la page
          </Link>
          <button
            type="button"
            onClick={refreshAll}
            disabled={refreshing}
            className="admin-marketing-refresh"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Actualiser
          </button>
        </div>
      </header>

      <div className="admin-marketing-tabs">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => selectTab(id)}
            className={`admin-marketing-tab ${tab === id ? 'is-active' : ''}`}
          >
            <Icon className="h-4 w-4" strokeWidth={1.75} />
            {label}
          </button>
        ))}
      </div>

      {tab === 'produits' && <AdminPromoProductsSection refreshToken={refreshToken} />}
      {tab === 'coupons' && <AdminPromoCouponsSection refreshToken={refreshToken} />}
      {tab === 'flash' && <AdminPromoFlashSection refreshToken={refreshToken} />}
    </div>
  );
}