'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { GeolocationAddressSuggestion } from '@/shared/lib/geolocation/reverse-geocode';

export type GeolocationState =
  | 'idle'
  | 'locating'
  | 'resolving'
  | 'ready'
  | 'denied'
  | 'unavailable'
  | 'error';

const GEO_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 18_000,
  maximumAge: 5 * 60 * 1000,
};

export function useGeolocationAddress(autoStart = false) {
  const [state, setState] = useState<GeolocationState>('idle');
  const [suggestion, setSuggestion] = useState<GeolocationAddressSuggestion | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const startedRef = useRef(false);

  const detect = useCallback(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setState('unavailable');
      setErrorMessage('La géolocalisation n’est pas disponible sur cet appareil.');
      return;
    }

    setState('locating');
    setErrorMessage(null);
    setSuggestion(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        setState('resolving');

        try {
          const res = await fetch(
            `/api/geolocation/reverse?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}`,
          );
          if (!res.ok) {
            throw new Error('reverse_failed');
          }
          const data = (await res.json()) as GeolocationAddressSuggestion;
          setSuggestion(data);
          setState('ready');
        } catch {
          setState('error');
          setErrorMessage('Impossible de convertir votre position en adresse.');
        }
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setState('denied');
          setErrorMessage('Autorisez l’accès à votre position dans les paramètres du navigateur.');
          return;
        }
        setState('error');
        setErrorMessage('Position introuvable. Réessayez ou saisissez l’adresse manuellement.');
      },
      GEO_OPTIONS,
    );
  }, []);

  const dismiss = useCallback(() => {
    setState('idle');
    setSuggestion(null);
    setErrorMessage(null);
  }, []);

  useEffect(() => {
    if (!autoStart || startedRef.current) return;
    startedRef.current = true;
    detect();
  }, [autoStart, detect]);

  return { state, suggestion, errorMessage, detect, dismiss };
}
