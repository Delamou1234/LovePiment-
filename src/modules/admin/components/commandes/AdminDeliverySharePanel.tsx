'use client';

import { useCallback, useEffect, useState } from 'react';
import { Check, Copy, Loader2, MapPin, MessageCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { buildCourierWhatsAppMessage } from '@/shared/lib/geolocation/maps-links';

type Props = {
  orderId: string;
  clientNom: string;
  clientTelephone: string;
  clientAdresse?: string;
  clientVille?: string;
  montantTotal: string | number;
  disabled?: boolean;
};

export function AdminDeliverySharePanel({
  orderId,
  clientNom,
  clientTelephone,
  clientAdresse = '',
  clientVille = '',
  montantTotal,
  disabled,
}: Props) {
  const [navUrl, setNavUrl] = useState<string | null>(null);
  const [hasCoords, setHasCoords] = useState(false);
  const [loading, setLoading] = useState(true);
  const [geocoding, setGeocoding] = useState(false);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/commandes/${orderId}/livraison`);
      if (!res.ok) return;
      const data = await res.json();
      const base = window.location.origin;
      setNavUrl(`${base}/livraison/${data.livraison.livraisonNavToken}`);
      setHasCoords(Boolean(data.livraison.coordinates));
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    void load();
  }, [load]);

  const geocoder = async (force = false) => {
    setGeocoding(true);
    try {
      const res = await fetch(`/api/admin/commandes/${orderId}/livraison`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ force }),
      });
      if (res.ok) {
        const data = await res.json();
        setHasCoords(Boolean(data.livraison?.coordinates));
      }
    } finally {
      setGeocoding(false);
    }
  };

  const copyLink = async () => {
    if (!navUrl) return;
    await navigator.clipboard.writeText(navUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareWhatsApp = () => {
    if (!navUrl) return;
    const text = buildCourierWhatsAppMessage({
      clientNom,
      clientTelephone,
      adresse: clientAdresse,
      ville: clientVille,
      navUrl,
      montantTotal: Number(montantTotal),
    });
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-xs text-zinc-400 py-2">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Préparation du lien livreur…
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-3 space-y-2">
      <p className="text-xs font-bold uppercase tracking-wide text-emerald-800 flex items-center gap-1.5">
        <MapPin className="h-3.5 w-3.5" />
        Partager au livreur
      </p>

      {!hasCoords && (
        <p className="text-xs text-amber-800">
          Position GPS non définie — géocodez l&apos;adresse avant d&apos;envoyer au livreur.
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-8 text-xs rounded-full bg-white"
          disabled={disabled || geocoding}
          onClick={() => geocoder(true)}
        >
          {geocoding ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5 mr-1" />
          )}
          {hasCoords ? 'Recalculer GPS' : 'Géocoder l’adresse'}
        </Button>

        <Button
          type="button"
          size="sm"
          className="h-8 text-xs rounded-full bg-emerald-700 hover:bg-emerald-800 text-white"
          disabled={disabled || !navUrl}
          onClick={copyLink}
        >
          {copied ? <Check className="h-3.5 w-3.5 mr-1" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
          {copied ? 'Copié' : 'Copier le lien'}
        </Button>

        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-8 text-xs rounded-full bg-white"
          disabled={disabled || !navUrl || !hasCoords}
          onClick={shareWhatsApp}
        >
          <MessageCircle className="h-3.5 w-3.5 mr-1" />
          WhatsApp livreur
        </Button>
      </div>

      {navUrl && (
        <p className="text-[11px] text-zinc-500 break-all font-mono bg-white/70 rounded px-2 py-1.5">
          {navUrl}
        </p>
      )}
    </div>
  );
}
