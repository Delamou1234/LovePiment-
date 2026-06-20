import { Mail, Gift, Bell } from 'lucide-react';

export function HomeNewsletter() {
  return (
    <section className="bg-white border-t border-[#ebe4d8] py-14 md:py-16">
      <div className="container-kabishop max-w-2xl mx-auto text-center space-y-5">
        <h2 className="font-serif text-2xl md:text-3xl font-bold text-zinc-900">
          Inscrivez-vous à notre newsletter
        </h2>
        <p className="text-sm text-zinc-500">
          Recevez en avant-première nos nouveautés, offres exclusives et conseils mode & beauté.
        </p>
        <form className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto pt-1">
          <input
            type="email"
            placeholder="Votre adresse e-mail"
            className="input-kabishop flex-1 rounded-full text-sm"
          />
          <button
            type="button"
            className="inline-flex shrink-0 items-center justify-center rounded-full bg-zinc-900 px-8 py-3 text-sm font-semibold text-white hover:bg-zinc-800 transition"
          >
            S&apos;inscrire
          </button>
        </form>
        <div className="flex flex-wrap justify-center gap-6 pt-4 text-xs text-zinc-500">
          <span className="flex items-center gap-1.5">
            <Gift className="h-3.5 w-3.5" /> Offres exclusives
          </span>
          <span className="flex items-center gap-1.5">
            <Bell className="h-3.5 w-3.5" /> Nouveautés en avant-première
          </span>
          <span className="flex items-center gap-1.5">
            <Mail className="h-3.5 w-3.5" /> Pas de spam
          </span>
        </div>
      </div>
    </section>
  );
}
