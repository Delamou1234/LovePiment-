'use client';

import { useCallback, useState } from 'react';
import { useRunAfterMount } from '@/shared/hooks/useRunAfterMount';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowUpRight,
  CreditCard,
  Loader2,
  MapPin,
  Package,
  Phone,
  X,
  XCircle,
} from 'lucide-react';
import type { CustomerOrderDetail } from '@/modules/compte/types';
import {
  COMPTE_BTN_PRIMARY,
  COMPTE_CARD,
  MODE_PAIEMENT_LABELS,
  STATUT_LABELS,
  STATUT_PAIEMENT_LABELS,
  STATUT_STYLES,
} from './compte-ui';

type Props = {
  orderId: string | null;
  onClose: () => void;
  onCancelled: () => void;
};

export function CompteCommandeDetailPanel({ orderId, onClose, onCancelled }: Props) {
  const [commande, setCommande] = useState<CustomerOrderDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const charger = useCallback(async (id: string) => {
    setLoading(true);
    setError('');
    setSuccessMsg('');
    setConfirmCancel(false);

    try {
      const res = await fetch(`/api/compte/commandes/${id}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? 'Impossible de charger la commande.');
        setCommande(null);
        return;
      }
      setCommande(data.commande);
    } catch {
      setError('Erreur réseau.');
      setCommande(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useRunAfterMount(() => {
    if (orderId) {
      void charger(orderId);
    } else {
      setCommande(null);
      setError('');
      setConfirmCancel(false);
      setSuccessMsg('');
    }
  }, [orderId, charger]);

  const annuler = async () => {
    if (!commande) return;
    setCancelling(true);
    setError('');

    try {
      const res = await fetch(`/api/compte/commandes/${commande.id}/annuler`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? 'Annulation impossible.');
        return;
      }

      setSuccessMsg(data.message ?? 'Commande annulée.');
      setConfirmCancel(false);
      onCancelled();
      await charger(commande.id);
    } catch {
      setError('Erreur réseau.');
    } finally {
      setCancelling(false);
    }
  };

  if (!orderId) return null;

  const statutClass = commande ? STATUT_STYLES[commande.statut] ?? STATUT_STYLES.EN_ATTENTE : '';
  const statutLabel = commande ? STATUT_LABELS[commande.statut] ?? commande.statut : '';

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        aria-label="Fermer"
        onClick={onClose}
      />

      <aside
        className={`relative flex h-full w-full max-w-lg flex-col bg-cream shadow-2xl animate-slideInRight ${COMPTE_CARD} rounded-none border-0 border-l border-beige-border`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="commande-detail-title"
      >
        <div className="flex items-center justify-between border-b border-beige-border/80 px-5 py-4 bg-white">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-olive">Détail commande</p>
            <h2 id="commande-detail-title" className="font-serif text-lg font-bold text-zinc-900">
              {commande ? `#${commande.id.slice(0, 8).toUpperCase()}` : 'Chargement…'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-beige-border text-zinc-500 hover:bg-cream"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {loading && (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-zinc-500">
              <Loader2 className="h-8 w-8 animate-spin text-olive" />
              <p className="text-sm">Chargement…</p>
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {successMsg && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              {successMsg}
            </div>
          )}

          {commande && !loading && (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1 ring-inset ${statutClass}`}
                >
                  {statutLabel}
                </span>
                <span className="text-xs text-zinc-500">
                  {new Intl.DateTimeFormat('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  }).format(new Date(commande.createdAt))}
                </span>
              </div>

              <section className="rounded-xl border border-beige-border bg-white p-4 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Articles</h3>
                <ul className="space-y-3">
                  {commande.items.map((item) => (
                    <li key={item.id} className="flex gap-3">
                      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-cream">
                        {item.produit.image ? (
                          <Image
                            src={item.produit.image}
                            alt={item.produit.nom}
                            fill
                            sizes="56px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-olive">
                            <Package className="h-5 w-5" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/produits/${item.produit.slug}`}
                          className="text-sm font-semibold text-zinc-900 hover:text-olive line-clamp-2"
                        >
                          {item.produit.nom}
                        </Link>
                        {item.variante.label && (
                          <p className="text-xs text-zinc-500">{item.variante.label}</p>
                        )}
                        <p className="text-xs text-zinc-600 mt-0.5">
                          {item.quantite} × {item.prixUnitaire.toLocaleString('fr-FR')} GN
                        </p>
                      </div>
                      <p className="text-sm font-bold text-zinc-900 shrink-0">
                        {(item.quantite * item.prixUnitaire).toLocaleString('fr-FR')} GN
                      </p>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="rounded-xl border border-beige-border bg-white p-4 space-y-2 text-sm">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-3">
                  Récapitulatif
                </h3>
                {commande.sousTotal != null && (
                  <div className="flex justify-between text-zinc-600">
                    <span>Sous-total</span>
                    <span>{commande.sousTotal.toLocaleString('fr-FR')} GN</span>
                  </div>
                )}
                {commande.fraisLivraison != null && (
                  <div className="flex justify-between text-zinc-600">
                    <span>Livraison</span>
                    <span>
                      {commande.fraisLivraison === 0
                        ? 'Gratuite'
                        : `${commande.fraisLivraison.toLocaleString('fr-FR')} GN`}
                    </span>
                  </div>
                )}
                {commande.remiseCoupon > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Coupon</span>
                    <span>−{commande.remiseCoupon.toLocaleString('fr-FR')} GN</span>
                  </div>
                )}
                {commande.remisePoints > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Points fidélité</span>
                    <span>−{commande.remisePoints.toLocaleString('fr-FR')} GN</span>
                  </div>
                )}
                {commande.remiseParrainage > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Parrainage</span>
                    <span>−{commande.remiseParrainage.toLocaleString('fr-FR')} GN</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-beige-border pt-2 font-bold text-zinc-900">
                  <span>Total</span>
                  <span>{commande.montantTotal.toLocaleString('fr-FR')} GN</span>
                </div>
              </section>

              <section className="rounded-xl border border-beige-border bg-white p-4 space-y-3 text-sm">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Livraison</h3>
                <p className="font-semibold text-zinc-900">{commande.clientNom}</p>
                <p className="flex items-start gap-2 text-zinc-600">
                  <MapPin className="h-4 w-4 shrink-0 mt-0.5 text-zinc-400" />
                  {commande.clientAdresse}, {commande.clientVille}
                </p>
                <p className="flex items-center gap-2 text-zinc-600">
                  <Phone className="h-4 w-4 text-zinc-400" />
                  {commande.clientTelephone}
                </p>
              </section>

              <section className="rounded-xl border border-beige-border bg-white p-4 space-y-2 text-sm">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-2">
                  <CreditCard className="h-3.5 w-3.5" />
                  Paiement
                </h3>
                <p className="text-zinc-700">
                  {MODE_PAIEMENT_LABELS[commande.modePaiement] ?? commande.modePaiement}
                </p>
                <p className="text-zinc-500 text-xs">
                  Statut :{' '}
                  {STATUT_PAIEMENT_LABELS[commande.statutPaiement] ?? commande.statutPaiement}
                </p>
              </section>

              {commande.statut !== 'ANNULEE' && commande.suiviToken && (
                <Link
                  href={`/suivi/${commande.suiviToken}`}
                  className="flex items-center justify-center gap-2 rounded-xl border border-beige-border bg-white py-3 text-sm font-semibold text-olive hover:bg-cream transition"
                >
                  Suivre la livraison
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              )}

              {commande.peutAnnuler && commande.statut !== 'ANNULEE' && (
                <div className="rounded-xl border border-red-200/80 bg-red-50/50 p-4 space-y-3">
                  {!confirmCancel ? (
                    <button
                      type="button"
                      onClick={() => setConfirmCancel(true)}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-red-300 bg-white px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-50 transition"
                    >
                      <XCircle className="h-4 w-4" />
                      Annuler cette commande
                    </button>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-sm text-red-800">
                        Confirmer l&apos;annulation ? Cette action est définitive.
                        {commande.statutPaiement === 'REUSSIE' &&
                          commande.modePaiement === 'CINETPAY' &&
                          ' Un remboursement sera traité sous 3 à 5 jours ouvrés.'}
                      </p>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setConfirmCancel(false)}
                          disabled={cancelling}
                          className="flex-1 rounded-xl border border-beige-border bg-white py-2.5 text-sm font-semibold text-zinc-700"
                        >
                          Non, garder
                        </button>
                        <button
                          type="button"
                          onClick={annuler}
                          disabled={cancelling}
                          className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                        >
                          {cancelling ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            'Confirmer'
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {!commande.peutAnnuler && commande.raisonNonAnnulation && commande.statut !== 'ANNULEE' && (
                <p className="text-xs text-zinc-500 leading-relaxed rounded-xl bg-white border border-beige-border p-3">
                  {commande.raisonNonAnnulation}{' '}
                  <Link href="/contact" className="font-semibold text-olive hover:underline">
                    Contacter le support
                  </Link>
                </p>
              )}
            </>
          )}
        </div>

        <div className="border-t border-beige-border bg-white p-4">
          <button type="button" onClick={onClose} className={`w-full ${COMPTE_BTN_PRIMARY}`}>
            Fermer
          </button>
        </div>
      </aside>
    </div>
  );
}
