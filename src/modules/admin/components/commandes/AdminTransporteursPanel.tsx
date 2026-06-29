'use client';

import { Truck } from 'lucide-react';
import Link from 'next/link';
import { ADMIN_CARD, ADMIN_CARD_PAD } from '@/modules/admin/components/admin-ui';

type Transporteur = {
  id: string;
  nom: string;
  slug: string;
  telephone: string | null;
  delaiMinHeures: number;
  delaiMaxHeures: number;
  actif: boolean;
};

export function AdminTransporteursPanel({ transporteurs }: { transporteurs: Transporteur[] }) {
  const actifs = transporteurs.filter((t) => t.actif);

  return (
    <section className={`admin-livraison-card ${ADMIN_CARD} ${ADMIN_CARD_PAD}`}>
      <div className="admin-livraison-card-head">
        <div className="admin-livraison-card-icon" aria-hidden>
          <Truck className="h-4 w-4" strokeWidth={1.75} />
        </div>
        <div>
          <h2 className="admin-livraison-card-title">Transporteurs externes</h2>
          <p className="admin-livraison-card-desc">
            Partenaires logistiques (délais, contact) — distincts des livreurs internes.
          </p>
        </div>
        <span className="admin-livraison-count">{actifs.length}</span>
      </div>

      {actifs.length === 0 ? (
        <div className="admin-livraison-empty">
          <p>Aucun transporteur configuré.</p>
          <p className="admin-livraison-empty-hint">
            Les livraisons passent par vos{' '}
            <Link href="/admin/livreurs" className="text-olive font-semibold hover:underline">
              livreurs internes
            </Link>
            . Ajoutez un transporteur via l&apos;API admin si besoin.
          </p>
        </div>
      ) : (
        <ul className="admin-transporteurs-grid">
          {actifs.map((t) => (
            <li key={t.id} className="admin-transporteur-item">
              <p className="font-semibold text-zinc-900">{t.nom}</p>
              <p className="text-xs text-zinc-500 mt-0.5">
                Délai {t.delaiMinHeures}–{t.delaiMaxHeures} h
                {t.telephone ? ` · ${t.telephone}` : ''}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
