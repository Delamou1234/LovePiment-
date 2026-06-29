'use client';

import { useRunAfterMount } from '@/shared/hooks/useRunAfterMount';
import { useCallback, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  CheckCircle2,
  Copy,
  Gift,
  Link2,
  Loader2,
  MessageCircle,
  Percent,
  Share2,
  ShoppingBag,
  Sparkles,
  Tag,
  UserPlus,
  Users,
} from 'lucide-react';
import { LOYALTY } from '@/modules/marketing/lib/constants';
import type { ParrainageStatut } from '@/modules/marketing/types';
import { useFeatureFlags } from '@/shared/hooks/useFeatureFlags';
import { COMPTE_INPUT } from '@/modules/compte/components/compte-ui';

type Props = {
  pointsFidelite: number;
  codeParrainage: string;
};

type OffrePublique = {
  code: string;
  type: 'POURCENT' | 'MONTANT_FIXE';
  valeur: number;
  minCommande: number | null;
  fin: string | null;
  libelle: string;
};

async function copier(texte: string) {
  await navigator.clipboard.writeText(texte);
}

export function CompteFideliteSection({ pointsFidelite, codeParrainage }: Props) {
  const { parrainageActif } = useFeatureFlags();
  const [statut, setStatut] = useState<ParrainageStatut | null>(null);
  const [offres, setOffres] = useState<OffrePublique[]>([]);
  const [loading, setLoading] = useState(true);
  const [codeSaisi, setCodeSaisi] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [messageOk, setMessageOk] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const charger = useCallback(async () => {
    setLoading(true);
    try {
      const [parrainRes, offresRes] = await Promise.all([
        fetch('/api/compte/parrainage'),
        fetch('/api/compte/offres'),
      ]);
      if (parrainRes.ok) {
        const data = await parrainRes.json();
        setStatut(data.statut as ParrainageStatut);
      }
      if (offresRes.ok) {
        const data = await offresRes.json();
        setOffres(data.offres ?? []);
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

  const remiseFilleulPct =
    statut?.remiseFilleulPct ?? Math.round(LOYALTY.FILLEUL_REMISE_PCT * 100);
  const valeurPointsGn = pointsFidelite * LOYALTY.VALEUR_POINT_GN;
  const parrainageEnabled = parrainageActif && (statut?.parrainageActif ?? true);

  const handleCopy = async (text: string, key: string) => {
    try {
      await copier(text);
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      /* ignore */
    }
  };

  const handleShare = async () => {
    const shareText = `Rejoins Love Piment& avec mon code ${monCode} et profite de −${remiseFilleulPct}% sur ta 1ère commande !`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Love Piment& — Parrainage',
          text: shareText,
          url: lienPartage,
        });
        return;
      } catch {
        /* fallback */
      }
    }
    await handleCopy(lienPartage, 'link');
  };

  const handleWhatsApp = () => {
    const text = `Coucou ! Inscris-toi sur Love Piment& avec mon code *${monCode}* (−${remiseFilleulPct}% sur ta 1ère commande) : ${lienPartage}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
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

  return (
    <div className="compte-fidelite-page">
      <header className="compte-fidelite-hero">
        <h2 className="compte-fidelite-hero-title">Mes offres & bons</h2>
        <p className="compte-fidelite-hero-desc">
          Cumulez des points à chaque commande, utilisez vos bons promo et parrainez vos proches pour
          gagner encore plus.
        </p>
      </header>

      <div className={`compte-fidelite-stats ${parrainageEnabled ? '' : 'compte-fidelite-stats--dual'}`}>
        <div className="compte-fidelite-stat is-points">
          <p className="compte-fidelite-stat-kicker">Mes points</p>
          <p className="compte-fidelite-stat-value">{pointsFidelite}</p>
          <p className="compte-fidelite-stat-hint">
            ≈ {valeurPointsGn.toLocaleString('fr-FR')} GN · 1 pt = {LOYALTY.VALEUR_POINT_GN} GN · max{' '}
            {Math.round(LOYALTY.MAX_REMISE_POINTS_PCT * 100)}% / commande
          </p>
        </div>

        {parrainageEnabled && (
          <div className="compte-fidelite-stat">
            <p className="compte-fidelite-stat-kicker flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              Mes filleuls
            </p>
            <p className="compte-fidelite-stat-value">
              {loading ? '…' : (statut?.filleulsCount ?? 0)}
            </p>
            <p className="compte-fidelite-stat-hint">
              +{statut?.pointsParrain ?? LOYALTY.PARRAIN_POINTS} pts par filleul après sa 1ère commande
            </p>
          </div>
        )}

        <div className="compte-fidelite-stat">
          <p className="compte-fidelite-stat-kicker flex items-center gap-1">
            <Tag className="h-3.5 w-3.5" />
            Bons actifs
          </p>
          <p className="compte-fidelite-stat-value">{loading ? '…' : offres.length}</p>
          <p className="compte-fidelite-stat-hint">Codes utilisables au checkout</p>
        </div>
      </div>

      <div className="compte-fidelite-actions">
        <Link href="/produits" className="compte-fidelite-action">
          <span className="compte-fidelite-action-icon">
            <ShoppingBag className="h-4 w-4" />
          </span>
          <span>
            Utiliser mes points
            <span className="block text-[11px] font-normal text-zinc-500">Au moment du paiement</span>
          </span>
        </Link>
        <Link href="/promos" className="compte-fidelite-action">
          <span className="compte-fidelite-action-icon">
            <Percent className="h-4 w-4" />
          </span>
          <span>
            Voir les promos
            <span className="block text-[11px] font-normal text-zinc-500">Offres & ventes flash</span>
          </span>
        </Link>
        <Link href="/compte?section=commandes" className="compte-fidelite-action">
          <span className="compte-fidelite-action-icon">
            <Sparkles className="h-4 w-4" />
          </span>
          <span>
            Mes commandes
            <span className="block text-[11px] font-normal text-zinc-500">Historique & suivi</span>
          </span>
        </Link>
      </div>

      <section className="compte-fidelite-panel">
        <h3 className="compte-fidelite-panel-title flex items-center gap-2">
          <Tag className="h-5 w-5 text-[#e91e8c]" />
          Bons de réduction disponibles
        </h3>
        <p className="compte-fidelite-panel-desc">
          Copiez un code et collez-le à l&apos;étape paiement de votre prochaine commande.
        </p>

        {loading ? (
          <p className="mt-4 text-sm text-zinc-500 flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Chargement des bons…
          </p>
        ) : offres.length === 0 ? (
          <p className="mt-4 rounded-xl border border-dashed border-[#ead6de] bg-[#fffafb] px-4 py-6 text-sm text-zinc-600 text-center">
            Aucun bon public pour le moment. Revenez bientôt ou consultez{' '}
            <Link href="/promos" className="font-semibold text-[#e91e8c] hover:underline">
              la page promos
            </Link>
            .
          </p>
        ) : (
          <div className="compte-fidelite-coupons">
            {offres.map((offre) => (
              <div key={offre.code} className="compte-fidelite-coupon">
                <div className="min-w-0">
                  <p className="compte-fidelite-coupon-code">{offre.code}</p>
                  <p className="compte-fidelite-coupon-meta">
                    {offre.libelle}
                    {offre.minCommande
                      ? ` · min. ${offre.minCommande.toLocaleString('fr-FR')} GN`
                      : ''}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void handleCopy(offre.code, offre.code)}
                  className="compte-fidelite-btn compte-fidelite-btn-outline shrink-0"
                  title="Copier le code"
                >
                  {copied === offre.code ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {parrainageEnabled ? (
        <section className="compte-fidelite-panel">
          <h3 className="compte-fidelite-panel-title flex items-center gap-2">
            <Share2 className="h-5 w-5 text-[#e91e8c]" />
            Parrainer un proche
          </h3>
          <p className="compte-fidelite-panel-desc">
            Partagez votre code : vos filleuls ont −{remiseFilleulPct}% sur leur première commande.
          </p>

          <div className="compte-fidelite-referral-box">
            <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">Votre code</p>
            <div className="compte-fidelite-code-row">
              <span className="compte-fidelite-code-pill">{monCode}</span>
              <button
                type="button"
                onClick={() => void handleCopy(monCode, 'code')}
                className="compte-fidelite-btn compte-fidelite-btn-outline"
              >
                {copied === 'code' ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                Copier
              </button>
            </div>

            <p className="mt-4 text-[11px] font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-1">
              <Link2 className="h-3.5 w-3.5" />
              Lien d&apos;invitation
            </p>
            <p className="compte-fidelite-link-field">{lienPartage}</p>

            <div className="compte-fidelite-btn-row">
              <button
                type="button"
                onClick={() => void handleCopy(lienPartage, 'link')}
                className="compte-fidelite-btn compte-fidelite-btn-outline"
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
                className="compte-fidelite-btn compte-fidelite-btn-primary"
              >
                <Share2 className="h-4 w-4" />
                Partager
              </button>
              <button
                type="button"
                onClick={handleWhatsApp}
                className="compte-fidelite-btn compte-fidelite-btn-whatsapp"
              >
                <MessageCircle className="h-4 w-4" />
                WhatsApp
              </button>
            </div>
          </div>

          {statut && statut.filleuls.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 mb-2">
                Filleuls récents
              </p>
              <div className="compte-fidelite-filleuls">
                {statut.filleuls.map((f) => (
                  <div key={f.id} className="compte-fidelite-filleul">
                    <span className="compte-fidelite-filleul-name">{f.nom}</span>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        f.premiereCommandePassee
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-amber-50 text-amber-800'
                      }`}
                    >
                      {f.premiereCommandePassee ? '1ère commande OK' : 'Inscrit'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      ) : (
        <p className="text-sm text-zinc-600 rounded-xl border border-[#ead6de] bg-[#fffafb] px-4 py-3">
          Le programme de parrainage est temporairement désactivé. Vos points fidélité restent actifs.
        </p>
      )}

      {parrainageEnabled && (
        <section className="compte-fidelite-panel">
          <h3 className="compte-fidelite-panel-title flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-[#e91e8c]" />
            Être parrainé
          </h3>
          <p className="compte-fidelite-panel-desc">
            Vous avez reçu un code d&apos;un ami ? Saisissez-le avant votre première commande pour
            bénéficier de −{remiseFilleulPct}%.
          </p>

          {loading ? (
            <p className="mt-4 text-sm text-zinc-500 flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Chargement…
            </p>
          ) : statut?.parrain ? (
            <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
              <p className="font-semibold">Parrainé par {statut.parrain.nom}</p>
              <p className="text-emerald-800/90 mt-1">
                Code {statut.parrain.code} — remise appliquée au checkout si c&apos;est votre première
                commande.
              </p>
            </div>
          ) : statut?.peutRattacherParrain ? (
            <form onSubmit={rattacherParrain} className="mt-4 flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={codeSaisi}
                onChange={(e) => setCodeSaisi(e.target.value.toUpperCase())}
                placeholder="Ex : KABI4X2YZ"
                className={`${COMPTE_INPUT} uppercase sm:flex-1`}
              />
              <button
                type="submit"
                disabled={submitting || !codeSaisi.trim()}
                className="compte-fidelite-btn compte-fidelite-btn-primary px-6"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Valider'}
              </button>
            </form>
          ) : (
            <p className="mt-4 text-sm text-zinc-600 rounded-xl border border-[#ead6de] bg-[#fffafb] px-4 py-3">
              Le parrainage n&apos;est plus disponible après votre première commande payée.
            </p>
          )}

          {message && (
            <p
              className={`mt-3 text-sm flex items-center gap-1.5 ${
                messageOk ? 'text-emerald-600' : 'text-red-600'
              }`}
            >
              {messageOk && <CheckCircle2 className="h-4 w-4 shrink-0" />}
              {message}
            </p>
          )}
        </section>
      )}

      <div className="rounded-xl border border-[#ead6de] bg-[#fff5f9] px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-zinc-700">
          <Gift className="h-4 w-4 text-[#e91e8c]" />
          <span>
            <strong className="text-zinc-900">{pointsFidelite} points</strong> disponibles sur votre
            prochaine commande
          </span>
        </div>
        <Link
          href="/produits"
          className="compte-fidelite-btn compte-fidelite-btn-primary text-sm"
        >
          Commander
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
