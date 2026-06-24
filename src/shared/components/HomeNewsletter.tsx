import Link from 'next/link';
import Image from 'next/image';
import { Mail, Gift, ArrowRight } from 'lucide-react';

export function HomeNewsletter() {
  return (
    <section className="relative overflow-hidden bg-primary">
      <div className="absolute inset-0 opacity-25">
        <Image
          src="/images/love-piment-secret.png"
          alt=""
          fill
          className="object-cover object-center"
          sizes="100vw"
          aria-hidden
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/95 to-olive-dark/90" />

      <div className="container-shop relative py-16 md:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/60 mb-3">
              Restez connecté
            </p>
            <h2 className="font-serif text-2xl md:text-4xl font-bold text-white leading-tight">
              -10% sur votre première commande
            </h2>
            <p className="mt-4 text-sm md:text-base text-white/75 leading-relaxed max-w-md">
              Inscrivez-vous pour recevoir nos offres exclusives et nouveautés intimes en avant-première.
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
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-olive py-3.5 text-sm font-bold text-white hover:bg-olive-dark transition"
              >
                Rejoindre Love Piment&
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
