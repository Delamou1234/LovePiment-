'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { BadgeCheck, ChevronRight, Loader2, ShieldAlert, ShieldCheck, Truck } from 'lucide-react';
import { courierInitials } from '@/modules/admin/components/livreurs/courier-card.utils';

type LivreurPublic = {
  id: string;
  nom: string;
  photoUrl: string | null;
  typeEngin: string;
  commune: string | null;
  verifie: boolean;
  actif: boolean;
  reference: string;
  valide: boolean;
};

export default function LivreurVerifierPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [livreur, setLivreur] = useState<LivreurPublic | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`/api/public/livreurs/${id}`);
        const data = await res.json();
        if (!res.ok) {
          if (!cancelled) setError(data.message ?? 'Carte introuvable');
          return;
        }
        if (!cancelled) setLivreur(data.livreur as LivreurPublic);
      } catch {
        if (!cancelled) setError('Impossible de vérifier cette carte.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <div className="container-shop max-w-lg py-10 animate-fadeIn">
      <div className="mb-6 flex items-center gap-1.5 text-xs text-zinc-500">
        <Link href="/" className="font-medium transition hover:text-zinc-900">
          Accueil
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="font-bold text-zinc-800">Vérification livreur</span>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[#F2D4DC] bg-white shadow-sm">
        <div className="bg-gradient-to-r from-[#e91e8c] to-[#be185d] px-6 py-5 text-white">
          <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide opacity-90">
            <Truck className="h-4 w-4" />
            Love Piment&
          </div>
          <h1 className="mt-2 font-serif text-2xl font-bold">Vérification carte livreur</h1>
          <p className="mt-1 text-sm text-white/85">
            Scannez le QR code sur la carte pour confirmer l&apos;identité du livreur.
          </p>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-7 w-7 animate-spin text-zinc-400" />
            </div>
          ) : error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-5 text-center">
              <ShieldAlert className="mx-auto h-8 w-8 text-red-500" />
              <p className="mt-3 text-sm font-semibold text-red-800">{error}</p>
              <p className="mt-1 text-xs text-red-600">
                Cette carte n&apos;est pas reconnue ou n&apos;est plus active.
              </p>
            </div>
          ) : livreur ? (
            <div className="space-y-5">
              <div
                className={`rounded-xl border px-4 py-4 ${
                  livreur.valide
                    ? 'border-emerald-200 bg-emerald-50'
                    : 'border-amber-200 bg-amber-50'
                }`}
              >
                <div className="flex items-start gap-3">
                  {livreur.valide ? (
                    <ShieldCheck className="mt-0.5 h-6 w-6 shrink-0 text-emerald-600" />
                  ) : (
                    <ShieldAlert className="mt-0.5 h-6 w-6 shrink-0 text-amber-600" />
                  )}
                  <div>
                    <p
                      className={`text-sm font-bold ${
                        livreur.valide ? 'text-emerald-800' : 'text-amber-800'
                      }`}
                    >
                      {livreur.valide
                        ? 'Carte officielle valide'
                        : livreur.actif
                          ? 'Livreur enregistré — vérification en cours'
                          : 'Carte inactive'}
                    </p>
                    <p
                      className={`mt-1 text-xs ${
                        livreur.valide ? 'text-emerald-700' : 'text-amber-700'
                      }`}
                    >
                      {livreur.valide
                        ? 'Ce livreur est bien partenaire Love Piment& et peut effectuer des livraisons.'
                        : 'Contactez la boutique si vous avez un doute sur cette personne.'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 rounded-xl border border-zinc-100 bg-zinc-50/80 p-4">
                <div className="courier-verify-photo">
                  {livreur.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={livreur.photoUrl} alt={livreur.nom} />
                  ) : (
                    <span>{courierInitials(livreur.nom)}</span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-lg font-bold text-zinc-900">{livreur.nom}</p>
                  <p className="text-sm text-zinc-500">Livreur partenaire</p>
                  {livreur.verifie && (
                    <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-800">
                      <BadgeCheck className="h-3 w-3" />
                      Vérifié
                    </span>
                  )}
                </div>
              </div>

              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <div className="rounded-lg border border-zinc-100 px-3 py-2.5">
                  <dt className="text-[10px] font-bold uppercase tracking-wide text-zinc-400">
                    Référence
                  </dt>
                  <dd className="mt-0.5 font-mono font-bold text-[#e91e8c]">{livreur.reference}</dd>
                </div>
                <div className="rounded-lg border border-zinc-100 px-3 py-2.5">
                  <dt className="text-[10px] font-bold uppercase tracking-wide text-zinc-400">
                    Véhicule
                  </dt>
                  <dd className="mt-0.5 font-medium text-zinc-800">{livreur.typeEngin}</dd>
                </div>
                <div className="rounded-lg border border-zinc-100 px-3 py-2.5 sm:col-span-2">
                  <dt className="text-[10px] font-bold uppercase tracking-wide text-zinc-400">
                    Zone
                  </dt>
                  <dd className="mt-0.5 font-medium text-zinc-800">{livreur.commune ?? '—'}</dd>
                </div>
              </dl>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
