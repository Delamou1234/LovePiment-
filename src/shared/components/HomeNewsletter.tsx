import Link from 'next/link';
import Image from 'next/image';
import { Mail, Gift, ArrowRight } from 'lucide-react';

export function HomeNewsletter() {
  return (
    <section className="relative overflow-hidden bg-[#4a5240]">
      <div className="absolute inset-0 opacity-20">
        <Image
          src="https://images.unsplash.com/photo-1615634260167-c8cdede054de?w=1200&q=80&auto=format&fit=crop"
          alt=""
          fill
          className="object-cover"
          sizes="100vw"
          aria-hidden
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-r from-[#4a5240] via-[#4a5240]/95 to-[#3d4534]/90" />

      <div className="container-kabishop relative py-16 md:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/60 mb-3">
              Restez connecté
            </p>
            <h2 className="font-serif text-2xl md:text-4xl font-bold text-white leading-tight">
              -10% sur votre première commande
            </h2>
            <p className="mt-4 text-sm md:text-base text-white/75 leading-relaxed max-w-md">
              Inscrivez-vous pour recevoir nos offres exclusives, nouveautés parfums & huiles, et conseils bien-être.
            </p>
            <div className="mt-6 flex flex-wrap gap-4 text-xs text-white/60">
              <span className="flex items-center gap-1.5">
                <Gift className="h-3.5 w-3.5" /> Offres membres
              </span>
              <span className="flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" /> Pas de spam
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-white/15 bg-white/10 backdrop-blur-md p-6 md:p-8">
            <form className="space-y-3">
              <input
                type="email"
                placeholder="Votre adresse e-mail"
                className="w-full rounded-xl border border-white/20 bg-white/95 px-4 py-3.5 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-white focus:ring-2 focus:ring-white/30"
              />
              <button
                type="button"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3.5 text-sm font-bold text-[#4a5240] hover:bg-[#faf7f2] transition"
              >
                Rejoindre KabiShop
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
            <p className="text-[11px] text-white/50 text-center mt-4">
              En vous inscrivant, vous acceptez notre{' '}
              <Link href="/mentions-legales" className="underline hover:text-white/70">
                politique de confidentialité
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
