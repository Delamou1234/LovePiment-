'use client';

import { useCallback, useEffect, useState } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

type Props = {
  commandeId: string;
  initialStatutPaiement: string;
  telephonePaiementInitial?: string | null;
  telephoneContact?: string | null;
};

type StatutReponse = {
  statutPaiement: string;
  statutCommande: string;
  paye: boolean;
};

export function PaymentStatusPoller({
  commandeId,
  initialStatutPaiement,
  telephonePaiementInitial,
  telephoneContact,
}: Props) {
  const [statutPaiement, setStatutPaiement] = useState(initialStatutPaiement);
  const [polling, setPolling] = useState(initialStatutPaiement !== 'REUSSIE');
  const [retrying, setRetrying] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [autreNumero, setAutreNumero] = useState(false);
  const [telephonePaiement, setTelephonePaiement] = useState(telephonePaiementInitial ?? '');

  const synchroniser = useCallback(async () => {
    try {
      const res = await fetch(`/api/paiement/statut?commandeId=${encodeURIComponent(commandeId)}`);
      if (!res.ok) return;
      const data = (await res.json()) as StatutReponse;
      setStatutPaiement(data.statutPaiement);
      if (data.paye) setPolling(false);
    } catch {
      /* réseau instable — on réessaie au prochain intervalle */
    }
  }, [commandeId]);

  useEffect(() => {
    if (!polling) return;
    const id = window.setInterval(() => void synchroniser(), 4000);
    return () => window.clearInterval(id);
  }, [polling, synchroniser]);

  async function relancerPaiement() {
    setRetrying(true);
    setErreur(null);
    try {
      const res = await fetch('/api/paiement/retry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          commandeId,
          telephonePaiement:
            autreNumero && telephonePaiement.trim() ? telephonePaiement.trim() : undefined,
        }),
      });
      const data = (await res.json()) as { paymentUrl?: string; message?: string };
      if (!res.ok || !data.paymentUrl) {
        setErreur(data.message ?? 'Impossible de relancer le paiement.');
        return;
      }
      window.location.href = data.paymentUrl;
    } catch {
      setErreur('Erreur réseau. Réessayez dans un instant.');
    } finally {
      setRetrying(false);
    }
  }

  if (statutPaiement === 'REUSSIE') return null;

  const echec = statutPaiement === 'ECHOUEE';

  return (
    <div
      className={`rounded-2xl border p-5 space-y-3 ${
        echec ? 'border-amber-200 bg-amber-50' : 'border-blue-100 bg-blue-50'
      }`}
    >
      <div className="flex items-start gap-3">
        {polling && !echec ? (
          <Loader2 className="h-5 w-5 shrink-0 animate-spin text-blue-600 mt-0.5" />
        ) : (
          <RefreshCw className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" />
        )}
        <div className="space-y-1 text-sm">
          <p className="font-bold text-zinc-900">
            {echec ? 'Paiement non finalisé' : 'Validation du paiement en cours…'}
          </p>
          <p className="text-zinc-600 text-xs leading-relaxed">
            {echec
              ? 'Votre paiement Orange Money n’a pas abouti. Vous pouvez réessayer sans repasser commande.'
              : 'Nous vérifions votre paiement Orange Money. Cette page se met à jour automatiquement.'}
          </p>
        </div>
      </div>

      {erreur && <p className="text-xs font-semibold text-red-600">{erreur}</p>}

      {echec && (
        <div className="space-y-2 text-xs">
          {telephoneContact && telephonePaiementInitial && telephonePaiementInitial !== telephoneContact && (
            <p className="text-zinc-600">
              Paiement prévu sur : <strong>{telephonePaiementInitial}</strong> · Contact livraison :{' '}
              {telephoneContact}
            </p>
          )}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={autreNumero}
              onChange={(e) => setAutreNumero(e.target.checked)}
              className="rounded border-zinc-300"
            />
            Utiliser un autre numéro Orange Money
          </label>
          {autreNumero && (
            <input
              type="tel"
              value={telephonePaiement}
              onChange={(e) => setTelephonePaiement(e.target.value)}
              placeholder="Ex : 620 12 34 56"
              className="input-shop w-full text-sm"
            />
          )}
        </div>
      )}

      <Button
        type="button"
        onClick={() => void relancerPaiement()}
        disabled={retrying}
        className="w-full sm:w-auto rounded-full font-bold"
        variant={echec ? 'default' : 'outline'}
      >
        {retrying ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Redirection…
          </>
        ) : (
          'Réessayer le paiement Orange Money'
        )}
      </Button>
    </div>
  );
}
