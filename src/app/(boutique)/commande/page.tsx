'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { usePanier } from '@/store/panier';
import { calculerTotauxCommande, formaterPrixGN, LIVRAISON_CONFIG } from '@/shared/lib/shipping';
import { CheckoutMarketingPanel } from '@/modules/marketing/components/CheckoutMarketingPanel';
import type { TotauxMarketing } from '@/modules/marketing/types';
import { 
  ChevronRight, 
  CreditCard, 
  Truck, 
  Loader2, 
  ShoppingBag, 
  PhoneCall, 
  MapPin,
  CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';

// ─── VALIDATION SCHEMA (ZOD) ─────────────────────────────────────────────────

const checkoutSchema = z.object({
  clientNom: z.string().min(2, 'Nom complet requis (minimum 2 caractères)').max(100),
  clientTelephone: z
    .string()
    .min(8, 'Numéro de téléphone requis (minimum 8 chiffres)')
    .regex(/^[\d+\s\-()]+$/, 'Format de téléphone invalide (chiffres uniquement)'),
  clientAdresse: z.string().min(5, 'Adresse de livraison précise requise').max(200),
  clientVille: z.string().min(2, 'Ville de livraison requise').max(100),
  modePaiement: z.enum(['CINETPAY', 'PAIEMENT_LIVRAISON']),
});

type CheckoutFormValues = z.infer<typeof checkoutSchema>;

// ─── CHECKOUT PAGE (CLIENT COMPONENT) ────────────────────────────────────────

export default function CheckoutPage() {
  const panier = usePanier();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [pointsFidelite, setPointsFidelite] = useState(0);
  const [totauxMarketing, setTotauxMarketing] = useState<TotauxMarketing | null>(null);
  const marketingRef = useRef({
    codeCoupon: null as string | null,
    pointsUtilises: 0,
    codeParrainage: null as string | null,
  });

  // Hydration mismatch fix
  useEffect(() => {
    setMounted(true);
  }, []);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      clientVille: 'Conakry',
      modePaiement: 'CINETPAY',
    },
  });

  // Pré-remplir depuis le compte client en base
  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const user = data?.user;
        if (!user || user.role !== 'customer') return;
        if (user.name) setValue('clientNom', user.name);
        if (user.telephone) setValue('clientTelephone', user.telephone);
        if (user.derniereAdresse) setValue('clientAdresse', user.derniereAdresse);
        if (user.derniereVille) setValue('clientVille', user.derniereVille);
      })
      .catch(() => {});

    fetch('/api/compte/profil')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.profil?.pointsFidelite != null) {
          setPointsFidelite(data.profil.pointsFidelite);
        }
      })
      .catch(() => {});
  }, [setValue]);

  const handleTotauxChange = useCallback((totaux: TotauxMarketing | null) => {
    setTotauxMarketing(totaux);
  }, []);

  const handleMarketingChange = useCallback(
    (data: {
      codeCoupon: string | null;
      pointsUtilises: number;
      codeParrainage: string | null;
    }) => {
      marketingRef.current = data;
    },
    [],
  );

  const selectedPaymentMethod = watch('modePaiement');
  const selectedVille = watch('clientVille') || 'Conakry';

  if (!mounted) {
    return (
      <div className="container-kabishop py-16 text-center">
        <div className="skeleton h-6 w-32 mx-auto mb-4"></div>
        <div className="skeleton h-64 w-full max-w-3xl mx-auto rounded-2xl"></div>
      </div>
    );
  }

  const items = panier.items;
  const { sousTotal, fraisLivraison, total, livraisonGratuite } = calculerTotauxCommande(
    items,
    selectedVille,
  );

  const totauxFinaux = totauxMarketing ?? {
    sousTotal,
    remiseCoupon: 0,
    remisePoints: 0,
    remiseParrainage: 0,
    fraisLivraison,
    montantTotal: total,
    livraisonGratuite,
    pointsUtilises: 0,
    pointsGagnes: 0,
    couponId: null,
    codeParrainageUtilise: null,
  };

  const formattedSubtotal = formaterPrixGN(totauxFinaux.sousTotal);
  const formattedShipping = totauxFinaux.livraisonGratuite
    ? 'Offerte'
    : formaterPrixGN(totauxFinaux.fraisLivraison);
  const formattedTotal = formaterPrixGN(totauxFinaux.montantTotal);

  const onSubmit = async (values: CheckoutFormValues) => {
    if (items.length === 0) {
      setErrorMsg('Votre panier est vide.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const response = await fetch('/api/paiement', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientNom: values.clientNom,
          clientTelephone: values.clientTelephone,
          clientAdresse: values.clientAdresse,
          clientVille: values.clientVille,
          modePaiement: values.modePaiement,
          codeCoupon: marketingRef.current.codeCoupon,
          pointsUtilises: marketingRef.current.pointsUtilises,
          codeParrainage: marketingRef.current.codeParrainage,
          items: items.map((i) => ({
            variantId: i.variantId,
            quantite: i.quantite,
            prixUnitaire: i.prix,
          })),
        }),
      });

      const contentType = response.headers.get('content-type') ?? '';
      const data = contentType.includes('application/json')
        ? await response.json()
        : { message: 'Erreur serveur. Réessayez ou choisissez le paiement à la livraison.' };

      if (!response.ok) {
        if (response.status === 401) {
          router.push('/connexion?redirect=/commande');
          return;
        }
        throw new Error(data.message || 'Une erreur est survenue lors de la commande.');
      }

      // Vider le panier après commande réussie
      panier.viderPanier();

      // Redirection ou paiement
      if (values.modePaiement === 'CINETPAY' && data.redirect && data.paymentUrl) {
        // Redirection vers la passerelle CinetPay
        window.location.href = data.paymentUrl;
      } else {
        // Redirection directe vers la page de confirmation
        router.push(`/commande/confirmation?id=${data.commandeId}`);
      }
    } catch (err: any) {
      console.error('[Checkout error]', err);
      setErrorMsg(err.message || 'Erreur lors de la validation. Veuillez réessayer.');
      setLoading(false);
    }
  };

  return (
    <div className="container-kabishop py-8 animate-fadeIn">
      {/* ─── BREADCRUMB ────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1.5 text-xs text-zinc-500 mb-6">
        <Link href="/" className="hover:text-primary transition font-medium">Accueil</Link>
        <ChevronRight className="h-3 w-3" />
        <Link href="/panier" className="hover:text-primary transition font-medium">Mon Panier</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-zinc-800 font-bold">Tunnel de commande</span>
      </div>

      <h1 className="text-2xl font-black text-zinc-900 md:text-3xl mb-8">Passer la commande</h1>

      {items.length > 0 ? (
        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          
          {/* ─── COLONNE GAUCHE : ADRESSE & PAIEMENT ────────────────────────── */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* 1. Informations Client */}
            <div className="border border-zinc-100 rounded-2xl p-6 bg-white shadow-sm space-y-4">
              <h2 className="font-extrabold text-zinc-950 text-lg border-b border-zinc-100 pb-3 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" /> 1. Adresse de Livraison
              </h2>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Nom */}
                <div className="space-y-1.5">
                  <label htmlFor="clientNom" className="text-xs font-black uppercase text-zinc-500 tracking-wider">Nom & Prénom</label>
                  <input
                    id="clientNom"
                    type="text"
                    placeholder="Ex: Diallo Mamadou"
                    className="input-kabishop"
                    {...register('clientNom')}
                  />
                  {errors.clientNom && (
                    <p className="text-xs font-bold text-red-500">{errors.clientNom.message}</p>
                  )}
                </div>

                {/* Téléphone */}
                <div className="space-y-1.5">
                  <label htmlFor="clientTelephone" className="text-xs font-black uppercase text-zinc-500 tracking-wider">Téléphone (WhatsApp)</label>
                  <input
                    id="clientTelephone"
                    type="text"
                    placeholder="Ex: 620000000"
                    className="input-kabishop"
                    {...register('clientTelephone')}
                  />
                  {errors.clientTelephone && (
                    <p className="text-xs font-bold text-red-500">{errors.clientTelephone.message}</p>
                  )}
                </div>

                {/* Adresse */}
                <div className="space-y-1.5 sm:col-span-2">
                  <label htmlFor="clientAdresse" className="text-xs font-black uppercase text-zinc-500 tracking-wider">Adresse précise</label>
                  <input
                    id="clientAdresse"
                    type="text"
                    placeholder="Ex: Camayenne, près de la Mosquée, Immeuble X"
                    className="input-kabishop"
                    {...register('clientAdresse')}
                  />
                  {errors.clientAdresse && (
                    <p className="text-xs font-bold text-red-500">{errors.clientAdresse.message}</p>
                  )}
                </div>

                {/* Ville */}
                <div className="space-y-1.5">
                  <label htmlFor="clientVille" className="text-xs font-black uppercase text-zinc-500 tracking-wider">Ville</label>
                  <input
                    id="clientVille"
                    type="text"
                    placeholder="Conakry"
                    className="input-kabishop"
                    {...register('clientVille')}
                  />
                  {errors.clientVille && (
                    <p className="text-xs font-bold text-red-500">{errors.clientVille.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* 2. Moyen de Paiement */}
            <div className="border border-zinc-100 rounded-2xl p-6 bg-white shadow-sm space-y-4">
              <h2 className="font-extrabold text-zinc-950 text-lg border-b border-zinc-100 pb-3 flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" /> 2. Mode de Paiement
              </h2>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Mobile Money CinetPay */}
                <label 
                  className={`flex flex-col gap-2 p-4 rounded-xl border-2 cursor-pointer transition ${
                    selectedPaymentMethod === 'CINETPAY' 
                      ? 'border-primary bg-primary-50/20' 
                      : 'border-zinc-200 hover:border-zinc-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-zinc-950 text-sm">Mobile Money (Orange, MTN)</span>
                    <input
                      type="radio"
                      value="CINETPAY"
                      className="text-primary focus:ring-primary h-4 w-4"
                      {...register('modePaiement')}
                    />
                  </div>
                  <p className="text-xs text-zinc-500 leading-relaxed">
                    Réglez en ligne instantanément avec votre compte Orange Money ou MTN Mobile Money via la passerelle sécurisée CinetPay.
                  </p>
                </label>

                {/* Paiement livraison */}
                <label 
                  className={`flex flex-col gap-2 p-4 rounded-xl border-2 cursor-pointer transition ${
                    selectedPaymentMethod === 'PAIEMENT_LIVRAISON' 
                      ? 'border-primary bg-primary-50/20' 
                      : 'border-zinc-200 hover:border-zinc-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-zinc-950 text-sm">Paiement à la livraison</span>
                    <input
                      type="radio"
                      value="PAIEMENT_LIVRAISON"
                      className="text-primary focus:ring-primary h-4 w-4"
                      {...register('modePaiement')}
                    />
                  </div>
                  <p className="text-xs text-zinc-500 leading-relaxed">
                    Payez en espèces (GNF) directement au livreur lors de la réception de votre commande.
                  </p>
                </label>
              </div>
            </div>

            <CheckoutMarketingPanel
              sousTotal={sousTotal}
              clientVille={selectedVille}
              pointsDisponibles={pointsFidelite}
              onTotauxChange={handleTotauxChange}
              onMarketingChange={handleMarketingChange}
            />

          </div>

          {/* ─── COLONNE DROITE : RÉSUMÉ & CONFIRMATION ────────────────────── */}
          <div className="space-y-6">
            
            {/* Résumé de commande */}
            <div className="border border-zinc-100 rounded-2xl p-6 bg-zinc-50 space-y-4 shadow-sm">
              <h3 className="font-extrabold text-zinc-950 text-base border-b border-zinc-200 pb-3 flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-primary" /> Résumé de ma commande
              </h3>

              {/* Liste articles */}
              <div className="max-h-60 overflow-y-auto divide-y divide-zinc-200/60 pr-1">
                {items.map((item) => (
                  <div key={item.variantId} className="py-3 flex gap-3 items-center text-xs">
                    <div className="relative h-12 w-9 rounded-lg overflow-hidden shrink-0 border border-zinc-200 bg-zinc-50">
                      <Image
                        src={item.image}
                        alt={item.nomProduit}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-grow min-w-0">
                      <p className="font-extrabold text-zinc-950 line-clamp-1 leading-snug">{item.nomProduit}</p>
                      <p className="text-[10px] text-zinc-500 font-semibold pt-0.5">
                        {item.taille ? `T: ${item.taille}` : ''} {item.couleur ? `| C: ${item.couleur}` : ''}
                      </p>
                    </div>
                    <div className="shrink-0 text-right font-extrabold text-zinc-900">
                      <p>{(item.prix * item.quantite).toLocaleString('fr-FR')} GN</p>
                      <p className="text-[10px] text-zinc-400 font-semibold">Qté: {item.quantite}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Totaux */}
              <div className="border-t border-zinc-200 pt-3 space-y-2 text-xs font-semibold text-zinc-500">
                <div className="flex justify-between">
                  <span>Sous-total</span>
                  <span>{formattedSubtotal}</span>
                </div>
                {totauxFinaux.remiseCoupon > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Coupon</span>
                    <span>−{formaterPrixGN(totauxFinaux.remiseCoupon)}</span>
                  </div>
                )}
                {totauxFinaux.remisePoints > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Points fidélité</span>
                    <span>−{formaterPrixGN(totauxFinaux.remisePoints)}</span>
                  </div>
                )}
                {totauxFinaux.remiseParrainage > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Parrainage</span>
                    <span>−{formaterPrixGN(totauxFinaux.remiseParrainage)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Frais de livraison ({selectedVille})</span>
                  <span className={totauxFinaux.livraisonGratuite ? 'text-emerald-600 font-bold' : ''}>
                    {formattedShipping}
                  </span>
                </div>
                {!totauxFinaux.livraisonGratuite && (
                  <p className="text-[10px] text-zinc-400">
                    Livraison offerte dès {formaterPrixGN(LIVRAISON_CONFIG.seuilGratuit)} à Conakry
                  </p>
                )}
                
                <div className="border-t border-zinc-200 pt-3 flex justify-between items-end">
                  <span className="font-bold text-zinc-950 text-sm">Total final</span>
                  <span className="price-display">{formattedTotal}</span>
                </div>
              </div>

              {/* Bouton de confirmation */}
              <div className="pt-2">
                {errorMsg && (
                  <p className="text-xs font-bold text-red-500 pb-3 text-center">{errorMsg}</p>
                )}
                <Button 
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full py-6 rounded-full font-bold text-base shadow-lg flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" /> Traitement en cours...
                    </>
                  ) : selectedPaymentMethod === 'CINETPAY' ? (
                    <>
                      💳 Procéder au paiement
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-5 w-5" /> Confirmer ma commande
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Note d'information */}
            <div className="border border-zinc-100 rounded-2xl p-4 bg-white shadow-sm flex gap-3 text-xs leading-relaxed text-zinc-500">
              <Truck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-zinc-800">Besoin d'aide pour finaliser ?</p>
                <p className="mt-1">
                  Vous pouvez également nous appeler ou nous écrire directement sur WhatsApp au <a href="tel:+224620000000" className="text-primary font-bold hover:underline">+224 620 00 00 00</a>. Nous serons ravis de vous aider !
                </p>
              </div>
            </div>

          </div>

        </form>
      ) : (
        /* PANIER VIDE */
        <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-zinc-100 rounded-3xl bg-zinc-50/50">
          <div className="rounded-full bg-primary/10 p-6 text-primary mb-6">
            <ShoppingBag className="h-12 w-12" />
          </div>
          <h2 className="text-xl font-bold text-zinc-950 mb-2">Votre panier est vide</h2>
          <p className="text-sm text-zinc-500 max-w-xs leading-relaxed mb-8">
            Ajoutez d'abord des articles au panier pour pouvoir valider une commande.
          </p>
          <Link href="/produits">
            <Button className="btn-primary rounded-full px-8 py-5 text-base font-bold shadow-lg">
              Voir le catalogue
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
