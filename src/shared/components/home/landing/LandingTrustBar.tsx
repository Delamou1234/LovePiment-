import { Headphones, Lock, Package, Sparkles } from 'lucide-react';

const ITEMS = [
  {
    icon: Package,
    title: 'LIVRAISON DISCRÈTE',
    desc: 'Emballage neutre et sans indication.',
  },
  {
    icon: Lock,
    title: 'PAIEMENT SÉCURISÉ',
    desc: 'Transactions 100% sécurisées.',
  },
  {
    icon: Sparkles,
    title: 'PRODUITS DE QUALITÉ',
    desc: 'Matériaux sûrs et testés.',
  },
  {
    icon: Headphones,
    title: 'SUPPORT À L\'ÉCOUTE',
    desc: 'Notre équipe est là pour vous 7j/7.',
  },
];

export function LandingTrustBar() {
  return (
    <section className="lp-trust-bar py-10 md:py-12">
      <div className="container-shop">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          {ITEMS.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex flex-col items-center text-center lg:items-start lg:text-left">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-olive/40 text-olive">
                <Icon className="h-5 w-5" strokeWidth={1.75} />
              </div>
              <h3 className="text-xs font-bold tracking-[0.12em] text-white">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/60">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
