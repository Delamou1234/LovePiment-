'use client';

import { useState } from 'react';
import { Loader2, ThumbsDown, ThumbsUp } from 'lucide-react';
import type { SuiviCommandeDto } from '@/modules/livraison/services/tracking.service';
import { formaterDate } from '@/shared/lib/delivery-tracking';

interface OrderSatisfactionFormProps {
  token: string;
  satisfaction: SuiviCommandeDto['satisfaction'];
  onSubmitted: (suivi: SuiviCommandeDto) => void;
}

export function OrderSatisfactionForm({
  token,
  satisfaction,
  onSubmitted,
}: OrderSatisfactionFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showComment, setShowComment] = useState(false);
  const [pendingStatut, setPendingStatut] = useState<'SATISFAIT' | 'NON_SATISFAIT' | null>(null);
  const [commentaire, setCommentaire] = useState('');

  if (satisfaction) {
    const positif = satisfaction.statut === 'SATISFAIT';
    return (
      <div
        className={`rounded-xl border p-5 ${
          positif
            ? 'border-emerald-200 bg-emerald-50'
            : 'border-amber-200 bg-amber-50'
        }`}
      >
        <p className={`text-sm font-semibold ${positif ? 'text-emerald-800' : 'text-amber-800'}`}>
          {positif ? 'Merci pour votre avis positif !' : 'Merci, votre retour a été transmis à notre équipe.'}
        </p>
        {positif && (
          <div className="mt-4 rounded-xl border border-violet-200 bg-violet-50 p-4 text-sm text-violet-900 space-y-2">
            <p className="font-semibold">Vous aimez Love Piment& ?</p>
            <p className="text-violet-800">
              Parrainez une amie depuis{' '}
              <a href="/compte" className="font-bold underline">
                Mon compte → Fidélité
              </a>{' '}
              : elle obtient −5 % sur sa 1ʳᵉ commande, vous gagnez des points.
            </p>
          </div>
        )}
        {positif && (
          <p className="text-xs text-emerald-700 mt-2">
            Notez vos produits en détail depuis{' '}
            <a href="/compte" className="font-bold underline">
              Mon compte → Mes avis
            </a>
            .
          </p>
        )}
        {satisfaction.commentaire && (
          <p className="text-sm text-zinc-600 mt-2">« {satisfaction.commentaire} »</p>
        )}
        <p className="text-[11px] text-zinc-400 mt-2">
          Enregistré le {formaterDate(new Date(satisfaction.date))}
        </p>
      </div>
    );
  }

  const submit = async (statut: 'SATISFAIT' | 'NON_SATISFAIT', withComment = false) => {
    if (statut === 'NON_SATISFAIT' && !withComment && !showComment) {
      setPendingStatut(statut);
      setShowComment(true);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/suivi/${token}/satisfaction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          statut,
          commentaire: commentaire.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Impossible d\'envoyer votre avis');
        return;
      }
      onSubmitted(data.suivi);
    } catch {
      setError('Erreur réseau, réessayez.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-[#F2D4DC] bg-white p-6 shadow-sm">
      <h2 className="font-bold text-zinc-900 mb-1">Votre commande est livrée</h2>
      <p className="text-sm text-zinc-600 mb-5">
        Êtes-vous satisfait(e) de votre achat ?
      </p>

      {!showComment ? (
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            disabled={loading}
            onClick={() => submit('SATISFAIT')}
            className="inline-flex flex-1 min-w-[140px] items-center justify-center gap-2 rounded-full bg-[#9B1B2E] px-5 py-3 text-sm font-semibold text-white hover:bg-[#6E1020] transition disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ThumbsUp className="h-4 w-4" />}
            Oui, satisfait(e)
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => submit('NON_SATISFAIT')}
            className="inline-flex flex-1 min-w-[140px] items-center justify-center gap-2 rounded-full border border-[#F2D4DC] bg-[#FFF8F6] px-5 py-3 text-sm font-semibold text-zinc-700 hover:bg-[#FCEEE8] transition disabled:opacity-50"
          >
            <ThumbsDown className="h-4 w-4" />
            Non, pas satisfait(e)
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-zinc-600">
            Dites-nous ce qui n&apos;a pas convenu (optionnel) :
          </p>
          <textarea
            value={commentaire}
            onChange={(e) => setCommentaire(e.target.value)}
            rows={3}
            maxLength={500}
            placeholder="Produit, livraison, emballage…"
            className="w-full rounded-xl border border-[#F2D4DC] bg-[#FFF8F6] px-4 py-3 text-sm text-zinc-800 outline-none focus:border-[#9B1B2E]"
          />
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              disabled={loading}
              onClick={() => submit(pendingStatut ?? 'NON_SATISFAIT', true)}
              className="inline-flex items-center gap-2 rounded-full bg-[#9B1B2E] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#6E1020] transition disabled:opacity-50"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Envoyer mon avis
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => {
                setShowComment(false);
                setPendingStatut(null);
                setCommentaire('');
              }}
              className="text-sm text-zinc-500 hover:text-zinc-800"
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
    </div>
  );
}
