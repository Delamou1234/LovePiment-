'use client';

import Image from 'next/image';
import { useState } from 'react';
import { Lock, Send } from 'lucide-react';
import type { NewsletterPublicConfig } from '@/modules/marketing/services/newsletter.service';

const HEART_CLIP_ID = 'lp-newsletter-heart-clip';

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
    <div className="lp-neon-heart-badge relative aspect-[120/110] w-[9rem] shrink-0 md:w-[10.5rem]">
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
          className="object-cover object-[center_35%]"
          unoptimized={isExternal}
          sizes="(max-width: 768px) 144px, 168px"
        />
        <div className="absolute inset-0 bg-[#3d0818]/40" aria-hidden />
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

      <span className="absolute inset-0 z-10 flex items-center justify-center font-serif text-3xl font-bold text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)] md:text-4xl">
        -{remisePct}%
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

  if (!actif) return null;

  const isExternal = imageUrl.startsWith('http');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus('loading');
    setMessage('');

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

      setStatus('success');
      setEmail('');
      const code = data.couponCode ?? couponCode;
      setMessage(
        code
          ? `${data.message ?? 'Merci !'} Utilisez le code ${code} à la caisse.`
          : (data.message ?? 'Merci pour votre inscription !'),
      );
    } catch {
      setStatus('error');
      setMessage('Impossible de contacter le serveur. Réessayez plus tard.');
    }
  }

  return (
    <section className="lp-newsletter relative overflow-hidden">
      <div className="lp-newsletter-gradient absolute inset-0" aria-hidden />

      <div className="container-shop relative z-10 py-10 md:py-12">
        <div className="grid items-center gap-8 lg:grid-cols-[auto_minmax(0,1fr)] lg:gap-10">
          <div className="flex justify-center lg:justify-start">
            <NeonHeartBadge remisePct={remisePct} imageUrl={imageUrl} isExternal={isExternal} />
          </div>

          <div className="min-w-0 text-center lg:text-left">
            <h2 className="font-serif text-xl font-bold uppercase tracking-wide text-white md:text-2xl lg:text-[1.65rem]">
              {titre}
            </h2>

            <p className="mt-2 text-sm text-white md:text-base">
              <span className="font-bold text-[#ff8ec4]">-{remisePct}%</span>{' '}
              <span className="text-white">sur votre première commande.</span>
            </p>

            <p className="mt-1.5 text-sm text-white/85">{description}</p>

            <form
              className="mx-auto mt-5 flex max-w-md overflow-hidden rounded-lg shadow-lg lg:mx-0"
              onSubmit={handleSubmit}
            >
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={status === 'loading'}
                placeholder="Votre adresse e-mail"
                className="min-w-0 flex-1 border-0 bg-white px-4 py-3.5 text-sm text-zinc-800 outline-none placeholder:text-zinc-400 disabled:opacity-70"
              />
              <button
                type="submit"
                disabled={status === 'loading'}
                className="inline-flex shrink-0 items-center justify-center gap-2 bg-[#e91e8c] px-5 py-3.5 text-[11px] font-bold uppercase tracking-[0.08em] text-white transition hover:bg-[#c9187a] disabled:opacity-70 sm:px-6"
              >
                {status === 'loading' ? 'Envoi…' : "S'inscrire"}
                <Send className="h-4 w-4" />
              </button>
            </form>

            {message && (
              <p
                className={`mt-3 text-xs md:text-sm ${
                  status === 'error' ? 'text-red-200' : 'text-emerald-200'
                }`}
                role="status"
              >
                {message}
              </p>
            )}

            <p className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-white/70 lg:justify-start">
              <Lock className="h-3 w-3 shrink-0" />
              Pas de spam, promis !
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
