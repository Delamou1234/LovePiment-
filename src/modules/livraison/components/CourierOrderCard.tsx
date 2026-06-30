'use client';

import Link from 'next/link';
import {
  CheckCircle2,
  Coins,
  Loader2,
  MapPin,
  Package,
  Phone,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { COMPTE_CARD } from '@/modules/livraison/components/livreur-ui';
import type { CourierOrderPublicDto } from '@/modules/livraison/services/courier-order.service';
import {
  googleMapsNavigationUrl,
  wazeNavigationUrl,
} from '@/shared/lib/geolocation/maps-links';

type Props = {
  cmd: CourierOrderPublicDto;
  busyId: string | null;
  onPriseEnCharge: (id: string) => void;
  onLivrer: (id: string) => void;
  showOrdre?: boolean;
};

export function CourierOrderCard({
  cmd,
  busyId,
  onPriseEnCharge,
  onLivrer,
  showOrdre,
}: Props) {
  const enAttentePrise = !cmd.priseEnCharge;

  return (
    <article className={`${COMPTE_CARD} p-4 md:p-5 space-y-3`}>
      <div className="flex flex-wrap justify-between gap-2">
        <div>
          {showOrdre && cmd.ordreLivraison != null && (
            <p className="text-[10px] font-bold uppercase tracking-wide text-olive mb-0.5">
              Arrêt {cmd.ordreLivraison}
            </p>
          )}
          <p className="font-semibold text-zinc-900">{cmd.clientNom}</p>
          <p className="text-xs text-zinc-500">
            {cmd.statut} · {cmd.itemsCount} article(s)
          </p>
        </div>
        {cmd.priseEnCharge ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-800">
            <CheckCircle2 className="h-3 w-3" />
            Colis en charge
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-900">
            <Package className="h-3 w-3" />
            À récupérer
          </span>
        )}
      </div>

      {cmd.primeLivreurGn != null && cmd.primeLivreurGn > 0 && (
        <div className="inline-flex items-center gap-1.5 rounded-full border border-olive/25 bg-olive/5 px-3 py-1.5 text-xs font-semibold text-olive">
          <Coins className="h-3.5 w-3.5" />
          Votre prime : {cmd.primeLivreurGn.toLocaleString('fr-FR')} GN
        </div>
      )}

      {enAttentePrise && (
        <Button
          type="button"
          size="sm"
          className="w-full rounded-full bg-olive hover:bg-olive-dark"
          disabled={busyId === cmd.id}
          onClick={() => onPriseEnCharge(cmd.id)}
        >
          {busyId === cmd.id ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Package className="h-4 w-4 mr-1" />
              J&apos;ai récupéré le colis
            </>
          )}
        </Button>
      )}

      <div className="text-sm text-zinc-600">
        <p className="flex items-start gap-2">
          <MapPin className="h-4 w-4 shrink-0 text-olive mt-0.5" />
          <span>
            {cmd.clientAdresse}
            <br />
            {cmd.clientVille}
          </span>
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <a
          href={`tel:${cmd.clientTelephone.replace(/\s/g, '')}`}
          className="inline-flex items-center gap-1.5 rounded-full bg-olive px-4 py-2 text-xs font-semibold text-white"
        >
          <Phone className="h-3.5 w-3.5" />
          Appeler
        </a>
        {cmd.coordinates && (
          <>
            <a
              href={googleMapsNavigationUrl(cmd.coordinates, cmd.clientAdresse, cmd.clientVille)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 px-4 py-2 text-xs font-semibold text-zinc-800"
            >
              Google Maps
            </a>
            <a
              href={wazeNavigationUrl(cmd.coordinates)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 px-4 py-2 text-xs font-semibold text-zinc-800"
            >
              Waze
            </a>
          </>
        )}
        <Link
          href={`/livraison/${cmd.livraisonNavToken}`}
          className="inline-flex items-center gap-1.5 rounded-full border border-olive/30 bg-olive-light px-4 py-2 text-xs font-semibold text-olive"
        >
          Carte détaillée
        </Link>
      </div>

      {cmd.priseEnCharge && (
        <Button
          type="button"
          size="sm"
          className="w-full rounded-full bg-emerald-700 hover:bg-emerald-800"
          disabled={busyId === cmd.id}
          onClick={() => onLivrer(cmd.id)}
        >
          {busyId === cmd.id ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4 mr-1" />
              Marquer comme livrée
            </>
          )}
        </Button>
      )}
    </article>
  );
}
