'use client';

import { Loader2, MapPin, Navigation, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useGeolocationAddress } from '@/shared/hooks/useGeolocationAddress';
import type { GeolocationAddressSuggestion } from '@/shared/lib/geolocation/reverse-geocode';

type Props = {
  onAccept: (suggestion: GeolocationAddressSuggestion) => void;
  onDismiss?: () => void;
  autoStart?: boolean;
  showManualTrigger?: boolean;
  className?: string;
  compact?: boolean;
};

export function GeolocationAddressPrompt({
  onAccept,
  onDismiss,
  autoStart = false,
  showManualTrigger = true,
  className = '',
  compact = false,
}: Props) {
  const { state, suggestion, errorMessage, detect, dismiss } = useGeolocationAddress(autoStart);

  const handleDismiss = () => {
    dismiss();
    onDismiss?.();
  };

  const handleAccept = () => {
    if (!suggestion) return;
    onAccept(suggestion);
    dismiss();
  };

  if (state === 'idle' && showManualTrigger) {
    return (
      <button
        type="button"
        onClick={detect}
        className={`inline-flex items-center gap-2 rounded-full border border-olive/30 bg-olive-light/50 px-4 py-2 text-sm font-semibold text-olive transition hover:bg-olive-light ${className}`}
      >
        <Navigation className="h-4 w-4" />
        Utiliser ma position actuelle
      </button>
    );
  }

  if (state === 'locating' || state === 'resolving') {
    return (
      <div
        className={`flex items-center gap-3 rounded-xl border border-beige-border bg-cream/60 px-4 py-3 text-sm text-zinc-600 ${className}`}
      >
        <Loader2 className="h-4 w-4 shrink-0 animate-spin text-olive" />
        {state === 'locating' ? 'Localisation en cours…' : 'Conversion en adresse…'}
      </div>
    );
  }

  if (state === 'denied' || state === 'unavailable' || state === 'error') {
    return (
      <div
        className={`rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 ${className}`}
      >
        <p>{errorMessage}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {state !== 'unavailable' && (
            <Button type="button" size="sm" variant="outline" onClick={detect} className="rounded-full h-8 text-xs">
              Réessayer
            </Button>
          )}
          <Button type="button" size="sm" variant="ghost" onClick={handleDismiss} className="rounded-full h-8 text-xs">
            Saisir manuellement
          </Button>
        </div>
      </div>
    );
  }

  if (state === 'ready' && suggestion) {
    return (
      <div
        className={`relative rounded-xl border border-olive/30 bg-gradient-to-br from-olive-light/80 to-cream px-4 py-4 ${compact ? 'py-3' : ''} ${className}`}
      >
        <button
          type="button"
          onClick={handleDismiss}
          className="absolute right-3 top-3 rounded-full p-1 text-zinc-400 hover:bg-white/60 hover:text-zinc-600"
          aria-label="Fermer"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="flex gap-3 pr-8">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-olive shadow-sm">
            <MapPin className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold uppercase tracking-wide text-olive">Position détectée</p>
            <p className="mt-1 text-sm font-semibold text-zinc-900 leading-snug">{suggestion.adresse}</p>
            <p className="text-xs text-zinc-500 mt-0.5">{suggestion.ville}</p>
            {!compact && (
              <p className="mt-2 text-xs text-zinc-500">
                Souhaitez-vous enregistrer cette adresse pour vos livraisons ?
              </p>
            )}
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                onClick={handleAccept}
                className="rounded-full bg-olive hover:bg-olive-dark h-8 text-xs"
              >
                Utiliser cette adresse
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleDismiss}
                className="rounded-full h-8 text-xs"
              >
                Non merci
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
