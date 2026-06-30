'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useForm, type FieldErrors } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { usePanier } from '@/store/panier';
import { calculerTotauxCommande, formaterPrixGN, libelleLivraisonOfferte } from '@/shared/lib/shipping';
import {
  COMMUNES_CONAKRY_REFERENCE,
  CRENEAUX_LIVRAISON,
  QUARTIERS_PAR_COMMUNE,
} from '@/shared/lib/communes-conakry';
import { useLivraisonConfig } from '@/shared/hooks/useLivraisonConfig';
import { CheckoutMarketingPanel } from '@/modules/marketing/components/CheckoutMarketingPanel';
import { useCustomerSession } from '@/shared/providers/AuthSessionProvider';
import { GeolocationAddressPrompt } from '@/shared/components/GeolocationAddressPrompt';
import type { GeolocationAddressSuggestion } from '@/shared/lib/geolocation/reverse-geocode';
import type { TotauxMarketing } from '@/modules/marketing/types';
import { 
  ChevronRight, 
  CreditCard, 
  Truck, 
  Loader2, 
  ShoppingBag, 
  MapPin,
  ShieldCheck,
  Lock,
  Smartphone,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getShopPhoneDisplay, getShopTelHref, getShopWhatsAppHref } from '@/shared/lib/shop-contact';
import { validerTelephoneGuinee } from '@/shared/lib/phone-guinea';

// ─── VALIDATION SCHEMA (ZOD) ─────────────────────────────────────────────────

const checkoutSchema = z.object({
  clientNom: z.string().min(2, 'Nom complet requis (minimum 2 caractères)').max(100),
  clientTelephone: z
    .string()
    .min(8, 'Numéro de téléphone requis (minimum 8 chiffres)')
    .regex(/^[\d+\s\-()]+$/, 'Format de téléphone invalide (chiffres uniquement)'),
  clientAdresse: z.string().min(5, 'Adresse de livraison précise requise').max(200),
  clientCommune: z.string().min(2, 'Sélectionnez une commune').max(80),
  clientQuartier: z.string().max(120).optional(),
  clientRepere: z.string().max(200).optional(),
  clientVille: z.string().min(2, 'Ville de livraison requise').max(100),
  creneauLivraison: z.enum(['MATIN', 'APRES_MIDI', 'FLEXIBLE']).default('FLEXIBLE'),
  notes: z.string().max(500).optional(),
  telephonePaiement: z.string().max(20).optional(),
});

type CheckoutFormValues = z.infer<typeof checkoutSchema>;

const CHECKOUT_FIELD_ORDER: (keyof CheckoutFormValues)[] = [
  'clientNom',
  'clientTelephone',
  'clientCommune',
  'clientAdresse',
  'clientVille',
];

function focusFirstInvalidField(formErrors: FieldErrors<CheckoutFormValues>) {
  for (const key of CHECKOUT_FIELD_ORDER) {
    if (formErrors[key]) {
      const el = document.getElementById(String(key));
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.focus();
      }
      return;
    }
  }
}

function messageErreurPaiement(message: string): string {
  if (message.includes('return_url') || message.includes('notif_url')) {
    return 'Configuration Orange Money : l’URL du site doit être publique (HTTPS).';
  }
  if (message.includes('indisponible en local') || message.includes('URL publique')) {
    return message;
  }
  if (message.includes('non configuré') || message.includes('ORANGE_MONEY')) {
    return 'Paiement Orange Money non configuré. Contactez la boutique.';
  }
  return message;
}

// ─── CHECKOUT PAGE (CLIENT COMPONENT) ────────────────────────────────────────

export default function CheckoutPage() {
  const panier = usePanier();
  const livraisonConfig = useLivraisonConfig();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [totauxMarketing, setTotauxMarketing] = useState<TotauxMarketing | null>(null);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [geoDismissed, setGeoDismissed] = useState(false);
  const [autreNumeroPaiement, setAutreNumeroPaiement] = useState(false);
  const [checkoutContext, setCheckoutContext] = useState<{
    estPremiereCommande: boolean;
    bienvenueActif: boolean;
    codeBienvenue: string | null;
  } | null>(null);
  const [checkoutContextReady, setCheckoutContextReady] = useState(false);
  const [deliveryCoords, setDeliveryCoords] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const marketingRef = useRef({
    codeCoupon: null as string | null,
    pointsUtilises: 0,
    codeParrainage: null as string | null,
  });
  const { customer, hydrated: sessionHydrated, loading: sessionLoading } = useCustomerSession();

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
  } = useForm<CheckoutFormValues & { telephonePaiement?: string }>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      clientVille: livraisonConfig.villeParDefaut,
      clientCommune: COMMUNES_CONAKRY_REFERENCE[0],
      creneauLivraison: 'FLEXIBLE',
    },
  });


  // Pré-remplir depuis la session client (chargée à la connexion)
  useEffect(() => {
    if (!sessionHydrated || sessionLoading) return;

    if (customer) {
      if (customer.name) setValue('clientNom', customer.name);
      if (customer.telephone) setValue('clientTelephone', customer.telephone);
      if (customer.derniereAdresse) setValue('clientAdresse', customer.derniereAdresse);
      if (customer.derniereVille) setValue('clientVille', customer.derniereVille);
    }
    setProfileLoaded(true);
  }, [customer, sessionHydrated, sessionLoading, setValue]);

  useEffect(() => {
    fetch('/api/checkout/context')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setCheckoutContext({
            estPremiereCommande: Boolean(data.estPremiereCommande),
            bienvenueActif: Boolean(data.bienvenueActif),
            codeBienvenue: data.codeBienvenue ?? null,
          });
        }
      })
      .catch(() => {})
      .finally(() => setCheckoutContextReady(true));
  }, []);

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

  // eslint-disable-next-line react-hooks/incompatible-library -- react-hook-form watch pour le checkout
  const selectedVille = watch('clientVille') || livraisonConfig.villeParDefaut;
  const selectedCommune = watch('clientCommune') || '';
  const clientAdresse = watch('clientAdresse');
  const quartiers = QUARTIERS_PAR_COMMUNE[selectedCommune] ?? [];

  const applyCheckoutAddress = (suggestion: GeolocationAddressSuggestion) => {
    setValue('clientAdresse', suggestion.adresse, { shouldValidate: true });
    setValue('clientVille', suggestion.ville, { shouldValidate: true });
    setDeliveryCoords({
      latitude: suggestion.latitude,
      longitude: suggestion.longitude,
    });
  };

  if (!mounted) {
    return (
      <div className="checkout-page">
        <div className="container-shop py-16 text-center">
          <div className="skeleton h-6 w-32 mx-auto mb-4"></div>
          <div className="skeleton h-64 w-full max-w-3xl mx-auto rounded-2xl"></div>
        </div>
      </div>
    );
  }

  const items = panier.items;
  const { sousTotal, fraisLivraison, total, livraisonGratuite } = calculerTotauxCommande(
    items,
    selectedVille,
    livraisonConfig,
    selectedCommune,
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

    if (autreNumeroPaiement) {
      const tel = values.telephonePaiement?.trim();
      if (!tel) {
        setErrorMsg('Indiquez le numéro Orange Money utilisé pour le paiement.');
        return;
      }
      if (!validerTelephoneGuinee(tel)) {
        setErrorMsg('Numéro Orange Money invalide. Exemple : 620 00 00 00');
        return;
      }
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
          clientCommune: values.clientCommune,
          clientQuartier: values.clientQuartier || null,
          clientRepere: values.clientRepere || null,
          creneauLivraison: values.creneauLivraison,
          notes: values.notes || null,
          clientLatitude: deliveryCoords?.latitude ?? null,
          clientLongitude: deliveryCoords?.longitude ?? null,
          codeCoupon: marketingRef.current.codeCoupon,
          pointsUtilises: marketingRef.current.pointsUtilises,
          codeParrainage: marketingRef.current.codeParrainage,
          telephonePaiement: autreNumeroPaiement ? values.telephonePaiement?.trim() || null : null,
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
        : { message: 'Erreur serveur. Réessayez dans un instant.' };

      if (!response.ok) {
        if (response.status === 401) {
          router.push('/connexion?redirect=/commande');
          return;
        }
        throw new Error(
          messageErreurPaiement(data.message || 'Une erreur est survenue lors de la commande.'),
        );
      }

      // Vider le panier après commande réussie
      panier.viderPanier();

      // Redirection ou paiement
      if (data.redirect && data.paymentUrl) {
        window.location.href = data.paymentUrl;
      } else {
        router.push(`/commande/confirmation?id=${data.commandeId}`);
      }
    } catch (err: unknown) {
      console.error('[Checkout error]', err);
      setErrorMsg(err instanceof Error ? err.message : 'Erreur lors de la validation. Veuillez réessayer.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setLoading(false);
    }
  };

  const onInvalid = (formErrors: FieldErrors<CheckoutFormValues>) => {
    setErrorMsg('Veuillez corriger les champs en rouge avant de continuer.');
    requestAnimationFrame(() => focusFirstInvalidField(formErrors));
  };

  return (
    <div className="checkout-page">
      <div className="container-shop py-8 md:py-10 animate-fadeIn">
        <div className="flex items-center gap-1.5 text-xs text-zinc-500 mb-5">
          <Link href="/" className="hover:text-[#9B1B2E] transition font-medium">Accueil</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/panier" className="hover:text-[#9B1B2E] transition font-medium">Mon panier</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-zinc-800 font-bold">Commande</span>
        </div>

        <header className="checkout-hero">
          <h1 className="checkout-hero-title">Finaliser ma commande</h1>
          <p className="checkout-hero-sub">
            Livraison discrète à Conakry — paiement sécurisé Orange Money en quelques secondes.
          </p>
          <div className="checkout-steps" aria-label="Étapes de commande">
            <span className="checkout-step is-active">
              <span className="checkout-step-num">1</span>
              Adresse de livraison
            </span>
            <span className="checkout-step is-active">
              <span className="checkout-step-num">2</span>
              Paiement Orange Money
            </span>
          </div>
        </header>

        {items.length > 0 ? (
          <>
            {errorMsg && (
              <div role="alert" className="checkout-error-banner">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="checkout-layout">
              <div className="checkout-main">
                <section className="checkout-card">
                  <div className="checkout-card-head">
                    <div className="checkout-card-icon">
                      <MapPin className="h-5 w-5" strokeWidth={1.75} />
                    </div>
                    <div>
                      <h2 className="checkout-card-title">Où livrer votre colis ?</h2>
                      <p className="checkout-card-desc">Emballage discret — aucune mention sur le colis.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="checkout-field">
                      <label htmlFor="clientNom">Nom & prénom</label>
                      <input
                        id="clientNom"
                        type="text"
                        placeholder="Ex : Diallo Mamadou"
                        className="input-shop"
                        {...register('clientNom')}
                      />
                      {errors.clientNom && (
                        <p className="text-xs font-bold text-red-500 mt-1">{errors.clientNom.message}</p>
                      )}
                    </div>

                    <div className="checkout-field">
                      <label htmlFor="clientTelephone">Téléphone (WhatsApp)</label>
                      <input
                        id="clientTelephone"
                        type="text"
                        placeholder="Ex : 620 00 00 00"
                        className="input-shop"
                        {...register('clientTelephone')}
                      />
                      {errors.clientTelephone && (
                        <p className="text-xs font-bold text-red-500 mt-1">{errors.clientTelephone.message}</p>
                      )}
                    </div>

                    <div className="checkout-field">
                      <label htmlFor="clientCommune">Commune</label>
                      <select id="clientCommune" className="input-shop" {...register('clientCommune')}>
                        {COMMUNES_CONAKRY_REFERENCE.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                      {errors.clientCommune && (
                        <p className="text-xs font-bold text-red-500 mt-1">{errors.clientCommune.message}</p>
                      )}
                    </div>

                    <div className="checkout-field">
                      <label htmlFor="clientQuartier">Quartier</label>
                      <select id="clientQuartier" className="input-shop" {...register('clientQuartier')}>
                        <option value="">— Choisir —</option>
                        {quartiers.map((q) => (
                          <option key={q} value={q}>
                            {q}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="checkout-field sm:col-span-2">
                      <label htmlFor="clientAdresse">Rue / immeuble</label>
                      {profileLoaded && !clientAdresse?.trim() && !geoDismissed && (
                        <GeolocationAddressPrompt
                          autoStart
                          autoAccept
                          showManualTrigger={false}
                          compact
                          tone="checkout"
                          onAccept={applyCheckoutAddress}
                          onDismiss={() => setGeoDismissed(true)}
                          className="mb-3"
                        />
                      )}
                      <input
                        id="clientAdresse"
                        type="text"
                        placeholder="Ex : Camayenne, près de la mosquée, immeuble X"
                        className="input-shop"
                        {...register('clientAdresse')}
                      />
                      {errors.clientAdresse && (
                        <p className="text-xs font-bold text-red-500 mt-1">{errors.clientAdresse.message}</p>
                      )}
                    </div>

                    <div className="checkout-field sm:col-span-2">
                      <label htmlFor="clientRepere">Repère (près de…)</label>
                      <input
                        id="clientRepere"
                        type="text"
                        placeholder="Ex : face au marché, 2ᵉ étage…"
                        className="input-shop"
                        {...register('clientRepere')}
                      />
                    </div>

                    <div className="checkout-field sm:col-span-2">
                      <label htmlFor="creneauLivraison">Créneau de livraison</label>
                      <select id="creneauLivraison" className="input-shop" {...register('creneauLivraison')}>
                        {CRENEAUX_LIVRAISON.map((c) => (
                          <option key={c.value} value={c.value}>
                            {c.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="checkout-field sm:col-span-2">
                      <label htmlFor="notes">Instructions (optionnel)</label>
                      <textarea
                        id="notes"
                        rows={2}
                        placeholder="Ex : appelez avant d'arriver…"
                        className="input-shop resize-none"
                        {...register('notes')}
                      />
                    </div>

                    <div className="checkout-field">
                      <label htmlFor="clientVille">Ville</label>
                      <input
                        id="clientVille"
                        type="text"
                        placeholder="Conakry"
                        className="input-shop"
                        {...register('clientVille')}
                      />
                      {errors.clientVille && (
                        <p className="text-xs font-bold text-red-500 mt-1">{errors.clientVille.message}</p>
                      )}
                    </div>
                  </div>
                </section>

                <section className="checkout-card">
                  <div className="checkout-card-head">
                    <div className="checkout-card-icon">
                      <CreditCard className="h-5 w-5" strokeWidth={1.75} />
                    </div>
                    <div>
                      <h2 className="checkout-card-title">Paiement Orange Money</h2>
                      <p className="checkout-card-desc">Vous serez redirigé vers la page sécurisée Orange.</p>
                    </div>
                  </div>

                  <div className="mb-4 space-y-3">
                    <label className="flex items-start gap-2.5 cursor-pointer text-sm text-zinc-700">
                      <input
                        type="checkbox"
                        checked={autreNumeroPaiement}
                        onChange={(e) => {
                          setAutreNumeroPaiement(e.target.checked);
                          if (!e.target.checked) setValue('telephonePaiement', '');
                        }}
                        className="mt-1 rounded border-zinc-300 text-[#9B1B2E] focus:ring-[#9B1B2E]"
                      />
                      <span>
                        <strong>Payer avec un autre numéro Orange Money</strong>
                        <span className="block text-xs text-zinc-500 mt-0.5 font-normal">
                          Votre numéro WhatsApp / livraison reste inchangé. Ce numéro sert uniquement au paiement.
                        </span>
                      </span>
                    </label>
                        {autreNumeroPaiement && (
                      <div className="checkout-field pl-7">
                        <label htmlFor="telephonePaiement">Numéro Orange Money du payeur</label>
                        <input
                          id="telephonePaiement"
                          type="tel"
                          placeholder="Ex : 620 12 34 56"
                          className="input-shop"
                          {...register('telephonePaiement')}
                        />
                        {errors.telephonePaiement && (
                          <p className="text-xs font-bold text-red-500 mt-1">
                            {errors.telephonePaiement.message}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="checkout-om-card space-y-3">
                    <span className="checkout-om-badge">
                      <Smartphone className="h-3 w-3" />
                      Orange Money
                    </span>
                    <p className="text-sm font-semibold text-zinc-900 leading-relaxed">
                      Confirmez le paiement avec votre code OTP (USSD) sur votre téléphone.
                      L&apos;argent est versé directement sur le compte marchand Love Piment&amp;.
                    </p>
                    <p className="text-sm font-black text-[#9B1B2E]">
                      Montant à régler : {formattedTotal}
                    </p>
                    <div className="checkout-trust-row">
                      <span className="checkout-trust-pill">
                        <Lock className="h-3 w-3 text-[#9B1B2E]" />
                        Paiement sécurisé
                      </span>
                      <span className="checkout-trust-pill">
                        <ShieldCheck className="h-3 w-3 text-[#9B1B2E]" />
                        Livraison discrète
                      </span>
                    </div>
                  </div>
                </section>

                <CheckoutMarketingPanel
                  sousTotal={sousTotal}
                  clientVille={selectedVille}
                  clientCommune={selectedCommune}
                  estPremiereCommande={checkoutContext?.estPremiereCommande}
                  contexteCharge={checkoutContextReady}
                  bienvenueActif={checkoutContext?.bienvenueActif}
                  codeBienvenue={checkoutContext?.codeBienvenue}
                  onTotauxChange={handleTotauxChange}
                  onMarketingChange={handleMarketingChange}
                />
              </div>

              <aside className="space-y-4">
                <div className="checkout-summary checkout-summary--sticky">
                  <div className="checkout-card-head !mb-4 !pb-3">
                    <div className="checkout-card-icon">
                      <ShoppingBag className="h-5 w-5" strokeWidth={1.75} />
                    </div>
                    <div>
                      <h3 className="checkout-card-title">Récapitulatif</h3>
                      <p className="checkout-card-desc">
                        {items.length} article{items.length > 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>

                  <div className="max-h-52 overflow-y-auto divide-y divide-zinc-100 pr-1 -mx-1 px-1">
                    {items.map((item) => (
                      <div key={item.variantId} className="py-3 flex gap-3 items-center">
                        <div className="relative h-14 w-11 rounded-lg overflow-hidden shrink-0 border border-zinc-100 bg-zinc-50">
                          <Image
                            src={item.image}
                            alt={item.nomProduit}
                            fill
                            sizes="44px"
                            className="object-cover"
                          />
                        </div>
                        <div className="flex-grow min-w-0">
                          <p className="font-bold text-zinc-900 text-sm line-clamp-2 leading-snug">
                            {item.nomProduit}
                          </p>
                          <p className="text-[11px] text-zinc-500 mt-0.5">
                            {[item.taille && `T. ${item.taille}`, item.couleur && item.couleur]
                              .filter(Boolean)
                              .join(' · ')}{' '}
                            · Qté {item.quantite}
                          </p>
                        </div>
                        <p className="shrink-0 text-sm font-bold text-zinc-900 tabular-nums">
                          {(item.prix * item.quantite).toLocaleString('fr-FR')} GN
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 pt-4 border-t border-zinc-100 space-y-2 text-sm text-zinc-600">
                    <div className="flex justify-between">
                      <span>Sous-total</span>
                      <span className="font-semibold text-zinc-900">{formattedSubtotal}</span>
                    </div>
                    {totauxFinaux.remiseCoupon > 0 && (
                      <div className="flex justify-between text-emerald-600">
                        <span>Coupon</span>
                        <span className="font-semibold">−{formaterPrixGN(totauxFinaux.remiseCoupon)}</span>
                      </div>
                    )}
                    {totauxFinaux.remisePoints > 0 && (
                      <div className="flex justify-between text-emerald-600">
                        <span>Points fidélité</span>
                        <span className="font-semibold">−{formaterPrixGN(totauxFinaux.remisePoints)}</span>
                      </div>
                    )}
                    {totauxFinaux.remiseParrainage > 0 && (
                      <div className="flex justify-between text-emerald-600">
                        <span>Parrainage</span>
                        <span className="font-semibold">−{formaterPrixGN(totauxFinaux.remiseParrainage)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Livraison ({selectedVille})</span>
                      <span className={`font-semibold ${totauxFinaux.livraisonGratuite ? 'text-emerald-600' : 'text-zinc-900'}`}>
                        {formattedShipping}
                      </span>
                    </div>
                    {!totauxFinaux.livraisonGratuite && livraisonConfig.gratuiteActive && (
                      <p className="text-[11px] text-zinc-400">{libelleLivraisonOfferte(livraisonConfig)}</p>
                    )}
                    <div className="flex justify-between items-end pt-3 border-t border-zinc-100">
                      <span className="font-bold text-zinc-900">Total</span>
                      <span className="checkout-summary-total">{formattedTotal}</span>
                    </div>
                  </div>

                  <div className="mt-5">
                    <Button
                      type="submit"
                      disabled={loading}
                      className="btn-primary w-full py-6 rounded-full font-bold text-base shadow-lg flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          Redirection Orange Money…
                        </>
                      ) : (
                        <>
                          <Smartphone className="h-5 w-5" />
                          Payer avec Orange Money
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                <div className="checkout-help-card flex gap-3 text-xs leading-relaxed text-zinc-600">
                  <Truck className="h-5 w-5 text-[#9B1B2E] shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-zinc-800">Besoin d&apos;aide ?</p>
                    <p className="mt-1">
                      WhatsApp{' '}
                      <a
                        href={getShopWhatsAppHref()}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#9B1B2E] font-bold hover:underline"
                      >
                        ici
                      </a>{' '}
                      ou au{' '}
                      <a href={getShopTelHref()} className="text-[#9B1B2E] font-bold hover:underline">
                        {getShopPhoneDisplay()}
                      </a>
                      .
                    </p>
                  </div>
                </div>
              </aside>
            </form>
          </>
        ) : (
          <div className="checkout-empty">
            <div className="rounded-full bg-[#9B1B2E]/10 p-6 text-[#9B1B2E] mb-5">
              <ShoppingBag className="h-12 w-12" />
            </div>
            <h2 className="text-xl font-bold text-zinc-950 mb-2">Votre panier est vide</h2>
            <p className="text-sm text-zinc-500 max-w-xs leading-relaxed mb-8">
              Ajoutez des articles avant de passer commande.
            </p>
            <Link href="/produits">
              <Button className="btn-primary rounded-full px-8 py-5 text-base font-bold shadow-lg">
                Découvrir la boutique
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
