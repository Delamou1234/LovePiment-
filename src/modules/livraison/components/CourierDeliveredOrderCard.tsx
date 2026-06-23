'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Banknote,
  Calendar,
  ChevronDown,
  ChevronUp,
  Loader2,
  MapPin,
  Package,
  Phone,
} from 'lucide-react';
import { COMPTE_CARD } from '@/modules/livraison/components/livreur-ui';
import type { CourierHistoriqueDto } from '@/modules/livraison/services/courier-order.service';
import {
  googleMapsNavigationUrl,
  wazeNavigationUrl,
} from '@/shared/lib/geolocation/maps-links';

type DetailCommande = {
  id: string;
  statut: string;
  clientNom: string;
  clientTelephone: string;
  clientAdresse: string;
  clientVille: string;
  montantTotal: number;
  modePaiement: string;
  statutPaiement: string;
  livreeLe: string | null;
  livreurPaiementRecu: boolean | null;
  itemsCount: number;
  coordinates: { latitude: number; longitude: number } | null;
  livraisonNavToken: string;
  items: {
    id: string;
    quantite: number;
    prixUnitaire: number;
    nom: string;
    image: string | null;
  }[];
};

function formaterDate(iso: string | null) {
  if (!iso) return 'Date inconnue';
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

export function CourierDeliveredOrderCard({ livraison }: { livraison: CourierHistoriqueDto }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState<DetailCommande | null>(null);
  const [error, setError] = useState('');

  const chargerDetail = async () => {
    if (detail) {
      setOpen((v) => !v);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/livreur/commandes/${livraison.id}`, {
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? 'Impossible de charger le détail.');
        return;
      }
      setDetail(data.commande);
      setOpen(true);
    } catch {
      setError('Erreur réseau.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <article className={`${COMPTE_CARD} overflow-hidden`}>
      <button
        type="button"
        onClick={() => void chargerDetail()}
        className="w-full p-4 md:p-5 text-left hover:bg-cream/40 transition"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
              <Package className="h-3.5 w-3.5" />
              Livrée
            </p>
            <p className="font-semibold text-zinc-900">{livraison.clientNom}</p>
            <p className="text-xs text-zinc-500 flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {livraison.clientVille} · {livraison.itemsCount} article
              {livraison.itemsCount > 1 ? 's' : ''}
            </p>
            <p className="text-xs text-zinc-500 flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formaterDate(livraison.livreeLe)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {livraison.modePaiement === 'PAIEMENT_LIVRAISON' &&
              livraison.livreurPaiementRecu != null && (
                <span
                  className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                    livraison.livreurPaiementRecu
                      ? 'bg-emerald-50 text-emerald-800'
                      : 'bg-amber-50 text-amber-800'
                  }`}
                >
                  {livraison.livreurPaiementRecu ? 'Espèces reçues' : 'Espèces non reçues'}
                </span>
              )}
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin text-olive" />
            ) : open ? (
              <ChevronUp className="h-4 w-4 text-zinc-400" />
            ) : (
              <ChevronDown className="h-4 w-4 text-zinc-400" />
            )}
          </div>
        </div>
      </button>

      {error && <p className="px-4 pb-3 text-sm text-red-600">{error}</p>}

      {open && detail && (
        <div className="border-t border-beige-border/60 bg-cream/30 p-4 md:p-5 space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 text-sm">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-zinc-400">Client</p>
              <p className="font-medium text-zinc-900">{detail.clientNom}</p>
              <a
                href={`tel:${detail.clientTelephone.replace(/\s/g, '')}`}
                className="inline-flex items-center gap-1 text-xs text-olive mt-1 hover:underline"
              >
                <Phone className="h-3.5 w-3.5" />
                {detail.clientTelephone}
              </a>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-zinc-400">
                Adresse
              </p>
              <p className="text-zinc-700">
                {detail.clientAdresse}
                <br />
                {detail.clientVille}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-white border border-beige-border px-2.5 py-1 font-semibold text-zinc-700">
              Paiement :{' '}
              {detail.statutPaiement === 'REUSSIE'
                ? 'Payé'
                : detail.statutPaiement === 'ECHOUEE'
                  ? 'Non payé'
                  : 'En attente'}
            </span>
            <span className="rounded-full bg-white border border-beige-border px-2.5 py-1 font-semibold text-zinc-700">
              {detail.modePaiement === 'PAIEMENT_LIVRAISON' ? 'À la livraison' : 'En ligne'}
            </span>
            <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-1 font-semibold text-emerald-800">
              <Banknote className="inline h-3 w-3 mr-1" />
              {detail.montantTotal.toLocaleString('fr-FR')} GN
            </span>
          </div>

          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-zinc-400 mb-2">
              Articles livrés
            </p>
            <ul className="space-y-2">
              {detail.items.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center gap-3 rounded-xl border border-beige-border bg-white p-2.5"
                >
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-cream">
                    {item.image ? (
                      <Image src={item.image} alt="" fill className="object-cover" sizes="48px" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-zinc-300">
                        <Package className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-zinc-900 truncate">{item.nom}</p>
                    <p className="text-xs text-zinc-500">
                      Qté {item.quantite} · {item.prixUnitaire.toLocaleString('fr-FR')} GN / u.
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-wrap gap-2">
            {detail.coordinates && (
              <>
                <a
                  href={googleMapsNavigationUrl(
                    detail.coordinates,
                    detail.clientAdresse,
                    detail.clientVille,
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold"
                >
                  Google Maps
                </a>
                <a
                  href={wazeNavigationUrl(detail.coordinates)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold"
                >
                  Waze
                </a>
              </>
            )}
            <Link
              href={`/livraison/${detail.livraisonNavToken}`}
              className="inline-flex items-center rounded-full border border-olive/30 bg-olive-light px-3 py-1.5 text-xs font-semibold text-olive"
            >
              Voir la carte
            </Link>
          </div>
        </div>
      )}
    </article>
  );
}
