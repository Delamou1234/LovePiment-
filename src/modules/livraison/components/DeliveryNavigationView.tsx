'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Loader2,
  MapPin,
  Navigation,
  Package,
  Phone,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { LivraisonNavigationDto } from '@/modules/livraison/services/delivery-navigation.service';
import { confirmAction, confirmDeliveryCopy, confirmPickupCopy } from '@/shared/lib/confirm-action';
import { distanceKm, formaterDistance } from '@/shared/lib/geolocation/distance';
import {
  googleMapsNavigationUrl,
  openStreetMapEmbedUrl,
  wazeNavigationUrl,
} from '@/shared/lib/geolocation/maps-links';

type Props = {
  token: string;
  initialData: LivraisonNavigationDto;
};

export function DeliveryNavigationView({ token, initialData }: Props) {
  const [livraison, setLivraison] = useState(initialData);
  const [courierPos, setCourierPos] = useState<{ latitude: number; longitude: number } | null>(
    null,
  );
  const [tracking, setTracking] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [watchId, setWatchId] = useState<number | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [priseEnChargeBusy, setPriseEnChargeBusy] = useState(false);

  const paiementEspecesEnAttente =
    livraison.modePaiement === 'PAIEMENT_LIVRAISON' &&
    livraison.statutPaiement === 'EN_ATTENTE';
  const peutConfirmerLivraison =
    livraison.statut !== 'LIVREE' && livraison.statut !== 'ANNULEE';

  const refresh = useCallback(async () => {
    const res = await fetch(`/api/livraison/${token}`, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      setLivraison(data.livraison);
    }
  }, [token]);

  useEffect(() => {
    return () => {
      if (watchId != null) navigator.geolocation.clearWatch(watchId);
    };
  }, [watchId]);

  const startTracking = () => {
    if (!navigator.geolocation) {
      setGeoError('Géolocalisation non disponible sur cet appareil.');
      return;
    }

    setGeoError(null);
    setTracking(true);

    const id = navigator.geolocation.watchPosition(
      (pos) => {
        setCourierPos({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
      },
      (err) => {
        setTracking(false);
        if (err.code === err.PERMISSION_DENIED) {
          setGeoError('Autorisez la position pour suivre l’itinéraire jusqu’au client.');
        } else {
          setGeoError('Position GPS indisponible.');
        }
      },
      { enableHighAccuracy: true, maximumAge: 10_000, timeout: 20_000 },
    );
    setWatchId(id);
  };

  const stopTracking = () => {
    if (watchId != null) navigator.geolocation.clearWatch(watchId);
    setWatchId(null);
    setTracking(false);
  };

  const confirmerPriseEnCharge = async () => {
    const confirmed = await confirmAction(confirmPickupCopy(livraison.clientNom));
    if (!confirmed) return;

    setPriseEnChargeBusy(true);
    try {
      const res = await fetch(`/api/livreur/commandes/${livraison.id}/prise-en-charge`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.message ?? 'Impossible de confirmer la prise en charge.');
        return;
      }
      await refresh();
    } finally {
      setPriseEnChargeBusy(false);
    }
  };

  const confirmerLivraison = async (paiementRecu?: boolean) => {
    const confirmed = await confirmAction(
      confirmDeliveryCopy(livraison.clientNom, paiementRecu),
    );
    if (!confirmed) return;

    setConfirming(true);
    try {
      const res = await fetch(`/api/livreur/commandes/${livraison.id}`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paiementRecu !== undefined ? { paiementRecu } : {}),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.message ?? 'Impossible de confirmer la livraison.');
        return;
      }
      await refresh();
    } finally {
      setConfirming(false);
    }
  };

  const coords = livraison.coordinates;
  const distance =
    coords && courierPos
      ? formaterDistance(distanceKm(courierPos, coords))
      : null;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-olive">Livraison</p>
            <h1 className="text-xl font-bold text-zinc-900 mt-1">{livraison.clientNom}</h1>
            <p className="text-sm text-zinc-600 mt-2 leading-relaxed">
              {livraison.clientAdresse}
              <br />
              {livraison.clientVille}
            </p>
          </div>
          <div className="text-right text-sm">
            <p className="font-bold text-zinc-900">
              {livraison.montantTotal.toLocaleString('fr-FR')} GN
            </p>
            <p className="text-xs text-zinc-500 mt-1">{livraison.statut}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <a
            href={`tel:${livraison.clientTelephone.replace(/\s/g, '')}`}
            className="inline-flex items-center gap-2 rounded-full bg-olive px-4 py-2 text-sm font-semibold text-white hover:bg-olive-dark"
          >
            <Phone className="h-4 w-4" />
            Appeler le client
          </a>
          {coords && (
            <>
              <a
                href={googleMapsNavigationUrl(coords, livraison.clientAdresse, livraison.clientVille)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
              >
                <Navigation className="h-4 w-4" />
                Google Maps
              </a>
              <a
                href={wazeNavigationUrl(coords)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
              >
                <ExternalLink className="h-4 w-4" />
                Waze
              </a>
            </>
          )}
        </div>
      </div>

      {coords ? (
        <div className="rounded-2xl border border-zinc-200 bg-white overflow-hidden shadow-sm">
          <div className="px-4 py-3 border-b border-zinc-100 flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-olive" />
              Destination
            </p>
            {distance && (
              <span className="text-xs font-bold text-olive bg-olive-light px-2.5 py-1 rounded-full">
                À {distance}
              </span>
            )}
          </div>
          <iframe
            title="Carte livraison"
            src={openStreetMapEmbedUrl(coords)}
            className="w-full h-[min(420px,55vh)] border-0"
            loading="lazy"
          />
        </div>
      ) : (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Position GPS en cours de calcul…
          <Button type="button" variant="outline" size="sm" className="ml-3 h-8" onClick={refresh}>
            Actualiser
          </Button>
        </div>
      )}

      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm space-y-3">
        <h2 className="text-sm font-bold text-zinc-900">Suivre jusqu’à l’adresse</h2>
        <p className="text-sm text-zinc-500">
          Activez votre position pour voir la distance restante jusqu’au client, puis lancez la
          navigation dans Google Maps ou Waze.
        </p>

        {geoError && (
          <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            {geoError}
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          {!tracking ? (
            <Button type="button" onClick={startTracking} className="rounded-full bg-olive hover:bg-olive-dark">
              <Navigation className="h-4 w-4 mr-2" />
              Activer ma position
            </Button>
          ) : (
            <Button type="button" variant="outline" onClick={stopTracking} className="rounded-full">
              Arrêter le suivi
            </Button>
          )}
          <Button type="button" variant="ghost" size="sm" onClick={refresh} className="rounded-full">
            <RefreshCw className="h-4 w-4 mr-1" />
            Actualiser
          </Button>
        </div>

        {courierPos && (
          <p className="text-xs text-zinc-400 font-mono">
            Votre position : {courierPos.latitude.toFixed(5)}, {courierPos.longitude.toFixed(5)}
          </p>
        )}
      </div>

      {peutConfirmerLivraison && !livraison.priseEnCharge && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-5 shadow-sm space-y-3">
          <h2 className="text-sm font-bold text-amber-950 flex items-center gap-2">
            <Package className="h-4 w-4" />
            Prise en charge du colis
          </h2>
          <p className="text-sm text-amber-900 leading-relaxed">
            Avant de partir, confirmez que vous avez récupéré le colis. Vous en serez seul
            responsable jusqu&apos;à la livraison.
          </p>
          <Button
            type="button"
            disabled={priseEnChargeBusy}
            className="rounded-full bg-amber-700 hover:bg-amber-800"
            onClick={confirmerPriseEnCharge}
          >
            {priseEnChargeBusy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Package className="h-4 w-4 mr-2" />
                J&apos;ai pris le colis
              </>
            )}
          </Button>
        </div>
      )}

      {peutConfirmerLivraison && livraison.priseEnCharge && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5 shadow-sm space-y-3">
          <h2 className="text-sm font-bold text-emerald-900 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Confirmation de livraison
          </h2>
          <p className="text-sm text-emerald-800">
            Colis en votre charge. Une fois remis au client, confirmez la livraison ici.
          </p>
          {paiementEspecesEnAttente && (
            <p className="text-xs text-amber-900 flex items-start gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              Déclarez si le client a payé en espèces.
            </p>
          )}

          {paiementEspecesEnAttente ? (
            <div className="grid gap-2 sm:grid-cols-2">
              <Button
                type="button"
                disabled={confirming}
                className="rounded-full bg-emerald-700 hover:bg-emerald-800"
                onClick={() => confirmerLivraison(true)}
              >
                {confirming ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Client a payé — colis livré'
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={confirming}
                className="rounded-full border-amber-300 text-amber-900 hover:bg-amber-100"
                onClick={() => confirmerLivraison(false)}
              >
                Client n&apos;a pas payé
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              disabled={confirming}
              className="rounded-full bg-emerald-700 hover:bg-emerald-800"
              onClick={() => confirmerLivraison()}
            >
              {confirming ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Confirmer la livraison
                </>
              )}
            </Button>
          )}
        </div>
      )}

      {livraison.statut === 'LIVREE' && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
          Livraison confirmée — cette commande est clôturée.
        </div>
      )}

      <p className="text-center text-xs text-zinc-400">
        <Link href="/" className="hover:text-zinc-600">
          Love Piment&
        </Link>
        {' · '}
        Lien réservé au livreur
      </p>
    </div>
  );
}
