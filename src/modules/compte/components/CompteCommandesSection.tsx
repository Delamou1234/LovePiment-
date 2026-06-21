import Link from 'next/link';
import { ArrowUpRight, Package, ShoppingBag } from 'lucide-react';
import type { CustomerOrderResume } from '@/modules/compte/types';
import {
  COMPTE_CARD,
  COMPTE_CARD_PAD,
  COMPTE_SECTION_DESC,
  COMPTE_SECTION_TITLE,
  STATUT_LABELS,
  STATUT_STYLES,
} from './compte-ui';

type Props = {
  commandes: CustomerOrderResume[];
};

export function CompteCommandesSection({ commandes }: Props) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-olive mb-2">
            Historique
          </p>
          <h2 className={COMPTE_SECTION_TITLE}>Mes commandes</h2>
          <p className={COMPTE_SECTION_DESC}>
            Suivez vos achats et accédez au détail de livraison
          </p>
        </div>
        <Link
          href="/produits"
          className="inline-flex items-center gap-1.5 rounded-full border border-beige-border bg-white px-4 py-2 text-sm font-semibold text-zinc-700 shadow-sm transition hover:bg-cream"
        >
          <ShoppingBag className="h-4 w-4" />
          Nouvelle commande
        </Link>
      </div>

      {commandes.length === 0 ? (
        <div className={`${COMPTE_CARD} ${COMPTE_CARD_PAD} text-center py-14`}>
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-cream text-olive">
            <Package className="h-7 w-7" />
          </div>
          <p className="font-serif text-lg font-bold text-zinc-900">Aucune commande</p>
          <p className="mt-2 text-sm text-zinc-500 max-w-sm mx-auto">
            Vos achats apparaîtront ici dès votre première commande.
          </p>
          <Link href="/produits" className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-olive hover:text-olive-dark">
            Découvrir la boutique
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <ul className="space-y-4">
          {commandes.map((cmd) => {
            const statutClass = STATUT_STYLES[cmd.statut] ?? STATUT_STYLES.EN_ATTENTE;
            const statutLabel = STATUT_LABELS[cmd.statut] ?? cmd.statut;

            return (
              <li
                key={cmd.id}
                className={`${COMPTE_CARD} p-5 md:p-6 transition hover:shadow-md hover:border-beige-border`}
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-4 min-w-0">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-cream text-olive">
                      <Package className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-zinc-900">
                          #{cmd.id.slice(0, 8).toUpperCase()}
                        </p>
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1 ring-inset ${statutClass}`}
                        >
                          {statutLabel}
                        </span>
                      </div>
                      <p className="text-sm text-zinc-500 mt-1">
                        {new Intl.DateTimeFormat('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        }).format(new Date(cmd.createdAt))}
                        {' · '}
                        {cmd.itemsCount} article{cmd.itemsCount > 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 sm:flex-col sm:items-end sm:gap-1 pl-16 sm:pl-0">
                    <p className="text-lg font-bold text-zinc-900">
                      {cmd.montantTotal.toLocaleString('fr-FR')}{' '}
                      <span className="text-sm font-semibold text-zinc-500">GN</span>
                    </p>
                    {cmd.suiviToken && (
                      <Link
                        href={`/suivi/${cmd.suiviToken}`}
                        className="inline-flex items-center gap-1 text-sm font-semibold text-olive hover:text-olive-dark transition"
                      >
                        Suivre la livraison
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </Link>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
