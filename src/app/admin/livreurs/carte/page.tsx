'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, Printer } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ADMIN_BTN_PRIMARY } from '@/modules/admin/components/admin-ui';
import { CourierIdCard } from '@/modules/admin/components/livreurs/CourierIdCard';
import type { CourierCardData } from '@/modules/admin/components/livreurs/courier-card.utils';
import { triggerCourierCardPrint } from '@/modules/admin/components/livreurs/print-courier-card';

export default function AdminLivreurCartePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const idParam = searchParams.get('id')?.trim() ?? '';
  const idsParam = searchParams.get('ids')?.trim() ?? '';
  const isSingle = searchParams.get('single') === '1' || Boolean(idParam);
  const autoPrint = searchParams.get('print') === '1';

  const [livreurs, setLivreurs] = useState<CourierCardData[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/livreurs');
      if (!res.ok) return;
      const data = await res.json();
      setLivreurs(data.livreurs ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const cartes = useMemo(() => {
    const ids = idParam
      ? [idParam]
      : idsParam
        ? idsParam.split(',').map((id) => id.trim()).filter(Boolean)
        : [];

    if (ids.length === 0) {
      return livreurs.filter((l) => l.actif);
    }

    const idSet = new Set(ids);
    return livreurs.filter((l) => idSet.has(l.id));
  }, [livreurs, idParam, idsParam]);

  useEffect(() => {
    if (!autoPrint || loading || cartes.length === 0) return;
    const timer = window.setTimeout(() => triggerCourierCardPrint(), 500);
    return () => window.clearTimeout(timer);
  }, [autoPrint, loading, cartes.length]);

  return (
    <div className={`courier-card-print-page${isSingle ? ' is-single' : ''}`}>
      <div className="courier-card-print-toolbar no-print">
        <div>
          <h1 className="text-xl font-bold text-zinc-900">
            {isSingle ? 'Carte livreur' : 'Cartes livreurs'}
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            {isSingle
              ? 'Une seule carte — format carte d\u2019identité (85 × 54 mm).'
              : `${cartes.length} carte${cartes.length > 1 ? 's' : ''} prête${cartes.length > 1 ? 's' : ''} à imprimer — format carte d\u2019identité (85 × 54 mm).`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={() => router.push('/admin/livreurs')}>
            Retour
          </Button>
          <Button
            type="button"
            className={ADMIN_BTN_PRIMARY}
            disabled={loading || cartes.length === 0}
            onClick={() => triggerCourierCardPrint()}
          >
            <Printer className="h-4 w-4" />
            Imprimer
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="courier-card-print-empty no-print">
          <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
        </div>
      ) : cartes.length === 0 ? (
        <div className="courier-card-print-empty no-print">
          <p className="text-sm text-zinc-500">Aucune carte à afficher.</p>
          <Link href="/admin/livreurs" className="text-sm font-semibold text-olive hover:text-olive-dark">
            Retour aux livreurs
          </Link>
        </div>
      ) : (
        <div className="courier-card-print-grid">
          {cartes.map((livreur) => (
            <CourierIdCard key={livreur.id} livreur={livreur} />
          ))}
        </div>
      )}
    </div>
  );
}
