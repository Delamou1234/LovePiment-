'use client';

import { useMemo, useState } from 'react';
import { ChevronDown, HelpCircle, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import { FAQ_CATEGORIES, FAQ_ITEMS, type FaqItem } from '@/shared/lib/faq-content';
import { getShopTelHref, getShopWhatsAppHref } from '@/shared/lib/shop-contact';

export function FaqPageContent() {
  const [filtre, setFiltre] = useState<FaqItem['category'] | 'all'>('all');
  const [ouvert, setOuvert] = useState<string | null>(FAQ_ITEMS[0]?.id ?? null);

  const items = useMemo(
    () => (filtre === 'all' ? FAQ_ITEMS : FAQ_ITEMS.filter((i) => i.category === filtre)),
    [filtre],
  );

  return (
    <div className="container-shop py-10 md:py-14 max-w-3xl">
      <header className="mb-8 text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-primary mb-2">Aide</p>
        <h1 className="text-3xl font-black text-zinc-900">Questions fréquentes</h1>
        <p className="text-sm text-zinc-500 mt-2 max-w-lg mx-auto">
          Tout ce qu&apos;il faut savoir avant de commander — livraison, paiement, suivi et fidélité.
        </p>
      </header>

      <div className="flex flex-wrap justify-center gap-2 mb-8">
        <button
          type="button"
          onClick={() => setFiltre('all')}
          className={`rounded-full px-3 py-1.5 text-xs font-semibold border ${
            filtre === 'all'
              ? 'bg-primary text-white border-primary'
              : 'border-zinc-200 text-zinc-600 hover:border-zinc-300'
          }`}
        >
          Tout
        </button>
        {FAQ_CATEGORIES.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setFiltre(c.id)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold border ${
              filtre === c.id
                ? 'bg-primary text-white border-primary'
                : 'border-zinc-200 text-zinc-600 hover:border-zinc-300'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {items.map((item) => {
          const open = ouvert === item.id;
          return (
            <div key={item.id} className="rounded-2xl border border-zinc-100 bg-white shadow-sm overflow-hidden">
              <button
                type="button"
                className="w-full flex items-center justify-between gap-3 p-4 text-left"
                onClick={() => setOuvert(open ? null : item.id)}
              >
                <span className="font-semibold text-zinc-900 text-sm">{item.question}</span>
                <ChevronDown
                  className={`h-4 w-4 shrink-0 text-zinc-400 transition ${open ? 'rotate-180' : ''}`}
                />
              </button>
              {open && (
                <div className="px-4 pb-4 text-sm text-zinc-600 leading-relaxed border-t border-zinc-50 pt-3">
                  {item.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-10 rounded-2xl border border-primary/20 bg-primary/5 p-6 text-center space-y-3">
        <HelpCircle className="h-8 w-8 text-primary mx-auto" />
        <p className="font-bold text-zinc-900">Pas trouvé votre réponse ?</p>
        <p className="text-sm text-zinc-600">Notre équipe répond rapidement par WhatsApp ou téléphone.</p>
        <div className="flex flex-wrap justify-center gap-3 pt-2">
          <a
            href={getShopWhatsAppHref('Bonjour, j’ai une question sur ma commande.')}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-[#25D366] px-5 py-2.5 text-sm font-bold text-white"
          >
            <MessageCircle className="h-4 w-4" />
            WhatsApp
          </a>
          <a
            href={getShopTelHref()}
            className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-5 py-2.5 text-sm font-semibold text-zinc-800"
          >
            Appeler
          </a>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 rounded-full border border-primary/30 px-5 py-2.5 text-sm font-semibold text-primary"
          >
            Formulaire contact
          </Link>
        </div>
      </div>
    </div>
  );
}
