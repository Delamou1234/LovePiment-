'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import {
  ArrowRight,
  Check,
  Copy,
  Lock,
  Package,
  Sparkles,
  Truck,
  Zap,
} from 'lucide-react';
import type { NewsletterPublicConfig } from '@/modules/marketing/services/newsletter.service';

const HEART_CLIP_ID = 'lp-newsletter-heart-clip';
const PORTRAIT_IMAGE = '/images/newsletter-woman.png';

const TRUST_POINTS = [
  { icon: Truck, label: 'Colis 100 % discret' },
  { icon: Zap, label: 'Code reçu instantanément' },
  { icon: Package, label: 'Livraison rapide Conakry' },
] as const;

function NeonHeartBadge({
  remisePct,
  imageUrl,
  isExternal,
}: {
  remisePct: number;
  imageUrl: string;
  isExternal: boolean;
}) {
  return (
    <div className="lp-neon-heart-badge relative aspect-[120/110] w-[10rem] shrink-0 sm:w-[11rem] md:w-[12rem]">
      <svg width="0" height="0" aria-hidden className="absolute">
        <defs>
          <clipPath id={HEART_CLIP_ID} clipPathUnits="objectBoundingBox">
            <path d="M0.5,0.891 C0.5,0.891 0.083,0.564 0.083,0.309 C0.083,0.164 0.183,0.073 0.3,0.073 C0.4,0.073 0.467,0.145 0.5,0.218 C0.533,0.145 0.6,0.073 0.7,0.073 C0.817,0.073 0.917,0.164 0.917,0.309 C0.917,0.564 0.5,0.891 0.5,0.891 Z" />
          </clipPath>
        </defs>
      </svg>

      <div
        className="absolute inset-0 overflow-hidden"
        style={{ clipPath: `url(#${HEART_CLIP_ID})` }}
      >
        <Image
          src={imageUrl}
          alt=""
          fill
          className="object-cover object-center scale-110"
          unoptimized={isExternal}
          sizes="(max-width: 768px) 160px, 192px"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#3d0818]/70 via-[#3d0818]/25 to-transparent" aria-hidden />
      </div>

      <svg
        viewBox="0 0 120 110"
        className="pointer-events-none absolute inset-0 h-full w-full drop-shadow-[0_0_18px_rgba(255,105,180,0.9)]"
        aria-hidden
      >
        <path
          d="M60 98 C60 98 10 62 10 34 C10 18 22 8 36 8 C48 8 56 16 60 24 C64 16 72 8 84 8 C98 8 110 18 110 34 C110 62 60 98 60 98Z"
          fill="none"
          stroke="#ff6eb4"
          strokeWidth="3"
          className="[filter:drop-shadow(0_0_8px_#ff6eb4)]"
        />
      </svg>

      <span className="absolute inset-0 z-10 flex flex-col items-center justify-center text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)]">
        <span className="font-serif text-4xl font-bold leading-none md:text-[2.75rem]">-{remisePct}%</span>
        <span className="mt-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white/90">1ère commande</span>
      </span>
    </div>
  );
}

type Props = NewsletterPublicConfig;

export function LandingNewsletter({
  actif,
  titre,
  description,
  remisePct,
  couponCode,
  imageUrl,
}: Props) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [issuedCode, setIssuedCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!actif) return null;

  const isExternal = imageUrl.startsWith('http');
  const displayCode = issuedCode ?? couponCode;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus('loading');
    setMessage('');
    setCopied(false);

    try {
      const res = await fetch('/api/marketing/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: 'homepage' }),
      });
      const data = (await res.json()) as { message?: string; couponCode?: string | null };
      if (!res.ok) {
        setStatus('error');
        setMessage(data.message ?? 'Une erreur est survenue.');
        return;
      }

      const code = data.couponCode ?? couponCode;
      setIssuedCode(code);
      setStatus('success');
      setEmail('');
      setMessage(
        data.message ?? 'Votre code promo est prêt — utilisez-le dès maintenant à la caisse.',
      );
    } catch {
      setStatus('error');
      setMessage('Impossible de contacter le serveur. Réessayez plus tard.');
    }
  }

  async function copyCode() {
    if (!displayCode) return;
    try {
      await navigator.clipboard.writeText(displayCode);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  return (
    <section className="lp-newsletter relative overflow-hidden" aria-labelledby="lp-newsletter-title">
      <div className="lp-newsletter-gradient absolute inset-0" aria-hidden />
      <div className="lp-newsletter-glow absolute inset-0" aria-hidden />

      <div className="lp-newsletter-portrait" aria-hidden>
        <div className="lp-newsletter-portrait-media">
          <Image
            src={PORTRAIT_IMAGE}
            alt=""
            fill
            priority={false}
            className="lp-newsletter-portrait-img"
            sizes="(min-width: 1280px) 420px, (min-width: 1024px) 360px"
          />
        </div>
      </div>

      <div className="container-shop relative z-10">
        <div className="lp-newsletter-layout">
          <div className="lp-newsletter-heart">
            <NeonHeartBadge remisePct={remisePct} imageUrl={imageUrl} isExternal={isExternal} />
          </div>

          <div className="lp-newsletter-content min-w-0 text-center lg:text-left">
            <p className="lp-newsletter-eyebrow">
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
              Offre réservée aux nouvelles clientes
            </p>

            <h2 id="lp-newsletter-title" className="lp-newsletter-title">
              {titre}
            </h2>

            <p className="lp-newsletter-lead">
              <span className="lp-newsletter-lead-accent">-{remisePct}%</span>
              <span> sur votre première commande</span>
            </p>

            <p className="lp-newsletter-desc">{description}</p>

            <ul className="lp-newsletter-trust" aria-label="Avantages">
              {TRUST_POINTS.map(({ icon: Icon, label }) => (
                <li key={label}>
                  <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={2} aria-hidden />
                  {label}
                </li>
              ))}
            </ul>

            {status === 'success' ? (
              <div className="lp-newsletter-success mx-auto lg:mx-0">
                <p className="lp-newsletter-success-title">
                  <Check className="h-4 w-4 shrink-0" aria-hidden />
                  C&apos;est bon, votre réduction vous attend !
                </p>
                {displayCode && (
                  <div className="lp-newsletter-code-row">
                    <code className="lp-newsletter-code">{displayCode}</code>
                    <button type="button" onClick={() => void copyCode()} className="lp-newsletter-code-copy">
                      {copied ? (
                        <>
                          <Check className="h-3.5 w-3.5" />
                          Copié
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          Copier
                        </>
                      )}
                    </button>
                  </div>
                )}
                <p className="lp-newsletter-success-msg">{message}</p>
                <Link href="/produits" className="lp-newsletter-cta-shop">
                  Commencer mes achats
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ) : (
              <>
                <form className="lp-newsletter-form mx-auto lg:mx-0" onSubmit={handleSubmit}>
                  <label htmlFor="newsletter-email" className="sr-only">
                    Adresse e-mail
                  </label>
                  <input
                    id="newsletter-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={status === 'loading'}
                    placeholder="votre@email.com"
                    autoComplete="email"
                    className="lp-newsletter-input"
                  />
                  <button type="submit" disabled={status === 'loading'} className="lp-newsletter-submit">
                    {status === 'loading' ? 'Envoi…' : `Recevoir mon -${remisePct}%`}
                  </button>
                </form>

                {message && status === 'error' && (
                  <p className="lp-newsletter-error" role="alert">
                    {message}
                  </p>
                )}
              </>
            )}

            <p className="lp-newsletter-privacy">
              <Lock className="h-3 w-3 shrink-0" aria-hidden />
              Gratuit · Pas de spam · Désinscription en 1 clic
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
