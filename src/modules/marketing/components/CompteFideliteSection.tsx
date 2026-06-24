'use client';

import { useRunAfterMount } from '@/shared/hooks/useRunAfterMount';
import { useCallback, useState } from 'react';
import {
  CheckCircle2,
  Copy,
  Gift,
  Link2,
  Loader2,
  Share2,
  UserPlus,
  Users,
} from 'lucide-react';
import { LOYALTY } from '@/modules/marketing/lib/constants';
import type { ParrainageStatut } from '@/modules/marketing/types';
import { useFeatureFlags } from '@/shared/hooks/useFeatureFlags';
import {
  COMPTE_BTN_PRIMARY,
  COMPTE_CARD,
  COMPTE_CARD_PAD,
  COMPTE_INPUT,
  COMPTE_SECTION_DESC,
  COMPTE_SECTION_TITLE,
} from '@/modules/compte/components/compte-ui';

type Props = {
  pointsFidelite: number;
  codeParrainage: string;
};

async function copier(texte: string) {
  await navigator.clipboard.writeText(texte);
}

export function CompteFideliteSection({ pointsFidelite, codeParrainage }: Props) {
  const { parrainageActif } = useFeatureFlags();
  const [statut, setStatut] = useState<ParrainageStatut | null>(null);
  const [loading, setLoading] = useState(true);
  const [codeSaisi, setCodeSaisi] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [messageOk, setMessageOk] = useState(false);
  const [copied, setCopied] = useState<'code' | 'link' | null>(null);

  const charger = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/compte/parrainage');
      if (res.ok) {
        const data = await res.json();
        setStatut(data.statut as ParrainageStatut);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useRunAfterMount(() => void charger(), [charger]);

  const monCode = statut?.monCode ?? codeParrainage;
  const lienPartage =
    typeof window !== 'undefined'
      ? `${window.location.origin}${statut?.cheminPartage ?? `/inscription?parrain=${monCode}`}`
      : statut?.cheminPartage ?? `/inscription?parrain=${monCode}`;

  const handleCopy = async (kind: 'code' | 'link') => {
    try {
      await copier(kind === 'code' ? monCode : lienPartage);
      setCopied(kind);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      /* ignore */
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Love Piment& — Parrainage',
          text: `Inscris-toi sur Love Piment& avec mon code ${monCode} et profite de −${statut?.remiseFilleulPct ?? Math.round(LOYALTY.FILLEUL_REMISE_PCT * 100)}% sur ta 1ère commande !`,
          url: lienPartage,
        });
        return;
      } catch {
        /* fallback copy */
      }
    }
    await handleCopy('link');
  };

  const rattacherParrain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!codeSaisi.trim() || submitting) return;

    setSubmitting(true);
    setMessage('');
    setMessageOk(false);
    try {
      const res = await fetch('/api/compte/parrainage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: codeSaisi.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? 'Erreur');
      setStatut(data.statut as ParrainageStatut);
      setCodeSaisi('');
      setMessage('Parrain enregistré — la remise s\'appliquera à votre première commande');
      setMessageOk(true);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Code invalide');
      setMessageOk(false);
    } finally {
      setSubmitting(false);
    }
  };

  const parrainageEnabled = parrainageActif && (statut?.parrainageActif ?? true);

  return (
    <div className="space-y-6">
      <div className={`${COMPTE_CARD} ${COMPTE_CARD_PAD} space-y-6`}>
        <div className="flex items-start gap-3 lg:hidden">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-olive-light text-olive">
            <Gift className="h-5 w-5" />
          </div>
          <div>
            <h2 className={COMPTE_SECTION_TITLE}>Fidélité & parrainage</h2>
            <p className={COMPTE_SECTION_DESC}>
              {parrainageEnabled
                ? 'Cumulez des points, parrainez et soyez parrainé'
                : 'Cumulez des points fidélité sur vos commandes'}
            </p>
          </div>
        </div>

        <div className={`grid gap-4 ${parrainageEnabled ? 'sm:grid-cols-2' : ''}`}>
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-olive to-olive-dark p-6 text-white">
            <div className="absolute top-0 right-0 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
            <p className="text-[11px] font-semibold uppercase tracking-widest text-white/70">
              Mes points
            </p>
            <p className="font-serif text-4xl font-bold mt-2">{pointsFidelite}</p>
            <p className="text-xs text-white/75 mt-3 leading-relaxed">
              1 pt = {LOYALTY.VALEUR_POINT_GN.toLocaleString('fr-FR')} GN · max{' '}
              {Math.round(LOYALTY.MAX_REMISE_POINTS_PCT * 100)}% par commande
            </p>
          </div>

          {parrainageEnabled && (
          <div className="rounded-2xl border border-beige-border bg-cream p-6">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500 flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" />
              Mes filleuls
            </p>
            <p className="font-serif text-4xl font-bold text-zinc-900 mt-2">
              {loading ? '…' : (statut?.filleulsCount ?? 0)}
            </p>
            <p className="text-xs text-zinc-500 mt-3 leading-relaxed">
              +{statut?.pointsParrain ?? LOYALTY.PARRAIN_POINTS} pts par filleul après sa 1ère commande
            </p>
          </div>
          )}
        </div>

        {!parrainageEnabled && (
          <p className="text-sm text-zinc-500 rounded-xl bg-cream border border-beige-border px-4 py-3">
            Le programme de parrainage est temporairement désactivé par Love Piment&.
          </p>
        )}
      </div>

      {parrainageEnabled && (
      <div className={`${COMPTE_CARD} ${COMPTE_CARD_PAD} space-y-5`}>
        <div>
          <h3 className="font-serif text-lg font-bold text-zinc-900 flex items-center gap-2">
            <Share2 className="h-5 w-5 text-olive" />
            Parrainer un proche
          </h3>
          <p className="mt-1 text-sm text-zinc-500">
            Partagez votre code ou lien : vos filleuls ont −
            {statut?.remiseFilleulPct ?? Math.round(LOYALTY.FILLEUL_REMISE_PCT * 100)}% sur leur
            première commande.
          </p>
        </div>

        <div className="rounded-2xl border border-beige-border bg-cream p-5 space-y-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500">
              Votre code
            </p>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <code className="font-serif text-2xl font-bold text-zinc-900 tracking-wider">
                {monCode}
              </code>
              <button
                type="button"
                onClick={() => handleCopy('code')}
                className="rounded-xl p-2.5 bg-white border border-beige-border text-zinc-500 hover:text-olive hover:border-olive/30 transition"
                title="Copier le code"
              >
                {copied === 'code' ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500 flex items-center gap-1.5">
              <Link2 className="h-3.5 w-3.5" />
              Lien d&apos;invitation
            </p>
            <p className="mt-2 text-xs text-zinc-600 break-all bg-white rounded-xl border border-beige-border px-3 py-2.5">
              {lienPartage}
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              <button
                type="button"
                onClick={() => handleCopy('link')}
                className="inline-flex items-center gap-2 rounded-xl border border-beige-border bg-white px-4 py-2 text-sm font-semibold text-zinc-700 hover:border-olive/30 transition"
              >
                {copied === 'link' ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                Copier le lien
              </button>
              <button
                type="button"
                onClick={() => void handleShare()}
                className={COMPTE_BTN_PRIMARY}
              >
                <Share2 className="h-4 w-4" />
                Partager
              </button>
            </div>
          </div>
        </div>

        {statut && statut.filleuls.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 mb-3">
              Filleuls récents
            </p>
            <ul className="divide-y divide-beige-border/80 rounded-xl border border-beige-border overflow-hidden">
              {statut.filleuls.map((f) => (
                <li
                  key={f.id}
                  className="flex items-center justify-between gap-3 bg-white px-4 py-3 text-sm"
                >
                  <span className="font-medium text-zinc-800 truncate">{f.nom}</span>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      f.premiereCommandePassee
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-amber-50 text-amber-700'
                    }`}
                  >
                    {f.premiereCommandePassee ? '1ère commande OK' : 'Inscrit'}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      )}

      {parrainageEnabled && (
      <div className={`${COMPTE_CARD} ${COMPTE_CARD_PAD} space-y-5`}>
        <div>
          <h3 className="font-serif text-lg font-bold text-zinc-900 flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-olive" />
            Être parrainé
          </h3>
          <p className="mt-1 text-sm text-zinc-500">
            Vous avez reçu un code d&apos;un ami ? Saisissez-le avant votre première commande pour
            bénéficier de −
            {statut?.remiseFilleulPct ?? Math.round(LOYALTY.FILLEUL_REMISE_PCT * 100)}%.
          </p>
        </div>

        {loading ? (
          <p className="text-sm text-zinc-400 flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Chargement…
          </p>
        ) : statut?.parrain ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            <p className="font-semibold">Parrainé par {statut.parrain.nom}</p>
            <p className="text-emerald-700/80 mt-1">
              Code {statut.parrain.code} — remise appliquée automatiquement au checkout si c&apos;est
              votre première commande.
            </p>
          </div>
        ) : statut?.peutRattacherParrain ? (
          <form onSubmit={rattacherParrain} className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={codeSaisi}
              onChange={(e) => setCodeSaisi(e.target.value.toUpperCase())}
              placeholder="Ex : KABI4X2YZ"
              className={`${COMPTE_INPUT} uppercase sm:flex-1`}
            />
            <button type="submit" disabled={submitting || !codeSaisi.trim()} className={COMPTE_BTN_PRIMARY}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Valider'}
            </button>
          </form>
        ) : (
          <p className="text-sm text-zinc-500 rounded-xl bg-cream border border-beige-border px-4 py-3">
            Le parrainage n&apos;est plus disponible après votre première commande payée.
          </p>
        )}

        {message && (
          <p
            className={`text-sm flex items-center gap-1.5 ${
              messageOk ? 'text-emerald-600' : 'text-red-600'
            }`}
          >
            {messageOk && <CheckCircle2 className="h-4 w-4 shrink-0" />}
            {message}
          </p>
        )}
      </div>
      )}
    </div>
  );
}
