'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Heart, Package, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

type Props = {
  orderId: string;
  clientNom: string;
  suiviToken?: string | null;
  modePaiement: string;
  statutPaiement: string;
};

function prenom(nom: string): string {
  return nom.trim().split(/\s+/)[0] || 'vous';
}

export function OrderConfirmationWelcome({
  orderId,
  clientNom,
  suiviToken,
  modePaiement,
  statutPaiement,
}: Props) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const key = `lp-order-welcome-${orderId}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, '1');
    setOpen(true);
  }, [orderId]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  const paiementEnLigne = modePaiement === 'CINETPAY';
  const paye = statutPaiement === 'REUSSIE';

  return (
    <div
      className="order-welcome-backdrop"
      role="dialog"
      aria-modal
      aria-labelledby="order-welcome-title"
      onClick={() => setOpen(false)}
    >
      <div className="order-welcome-modal" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="order-welcome-close"
          aria-label="Fermer"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="order-welcome-icon" aria-hidden>
          <CheckCircle2 className="h-10 w-10" strokeWidth={1.5} />
        </div>

        <h2 id="order-welcome-title" className="order-welcome-title">
          Commande bien reçue !
        </h2>

        <p className="order-welcome-lead">
          Merci <strong>{prenom(clientNom)}</strong>, votre commande{' '}
          <span className="font-semibold text-zinc-900">#{orderId.slice(-8).toUpperCase()}</span>{' '}
          est enregistrée.
        </p>

        <div className="order-welcome-care">
          <Heart className="h-4 w-4 shrink-0 text-[#e91e8c]" fill="#e91e8c" />
          <p>
            Notre équipe Love Piment&amp; <strong>prend votre dossier en charge</strong> dès
            maintenant. Vous serez informée à chaque étape, en toute discrétion.
          </p>
        </div>

        <ul className="order-welcome-steps">
          <li className="is-done">
            <CheckCircle2 className="h-4 w-4" />
            Commande enregistrée
          </li>
          <li className="is-active">
            <Sparkles className="h-4 w-4" />
            Prise en charge par notre équipe
          </li>
          <li>
            <Package className="h-4 w-4" />
            Préparation &amp; livraison discrète
          </li>
        </ul>

        <p className="order-welcome-payment">
          {paiementEnLigne && paye
            ? 'Paiement confirmé — nous préparons votre colis.'
            : paiementEnLigne
              ? 'Paiement en cours de validation — nous vous confirmons sous peu.'
              : 'Paiement à la livraison — notre livreuse vous contactera avant le passage.'}
        </p>

        <div className="order-welcome-actions">
          {suiviToken && (
            <Link href={`/suivi/${suiviToken}`} className="order-welcome-btn is-primary">
              Suivre ma commande
            </Link>
          )}
          <Button
            type="button"
            variant="outline"
            className="order-welcome-btn is-secondary"
            onClick={() => setOpen(false)}
          >
            Continuer
          </Button>
        </div>
      </div>
    </div>
  );
}
