import Link from 'next/link';
import { MapPin, Mail, MessageCircle } from 'lucide-react';

const WHATSAPP = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '224620000000';
const FACEBOOK = process.env.NEXT_PUBLIC_FACEBOOK_PAGE_URL ?? 'https://facebook.com/kabishop';

const AIDE_LINKS = [
  { label: 'Profil beauté', href: '/profil-beaute' },
  { label: 'Suivi de commande', href: '/suivi' },
  { label: 'Messagerie', href: '/messages' },
  { label: 'Livraison Conakry', href: '/apropos' },
  { label: 'Nous contacter', href: '/contact' },
  { label: 'FAQ', href: '/contact' },
];

const COMPTE_LINKS = [
  { label: 'Mon compte', href: '/compte' },
  { label: 'Connexion', href: '/connexion?redirect=/commande' },
  { label: 'Inscription', href: '/inscription?redirect=/commande' },
  { label: 'Mon panier', href: '/panier' },
  { label: 'Passer commande', href: '/commande' },
  { label: 'Administration', href: '/admin' },
];

const SOCIAL = [
  {
    label: 'Facebook',
    href: FACEBOOK,
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden>
        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
      </svg>
    ),
  },
  {
    label: 'Instagram',
    href: 'https://instagram.com/kabishop',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" aria-hidden>
        <rect x="2" y="2" width="20" height="20" rx="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      </svg>
    ),
  },
  {
    label: 'WhatsApp',
    href: `https://wa.me/${WHATSAPP}`,
    icon: <MessageCircle className="h-4 w-4" strokeWidth={1.75} aria-hidden />,
  },
];

function FooterLinks({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div>
      <h4 className="text-[11px] font-bold uppercase tracking-[0.15em] text-white/50 mb-5">
        {title}
      </h4>
      <ul className="space-y-3">
        {links.map(({ label, href }) => (
          <li key={label}>
            <Link
              href={href}
              className="text-sm text-white/75 hover:text-white transition-colors"
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ShopFooter({
  boutiqueLinks = [],
}: {
  boutiqueLinks?: { label: string; href: string }[];
}) {
  const year = new Date().getFullYear();

  return (
    <footer
      id="contact"
      className="mt-10 md:mt-14 rounded-t-2xl md:rounded-t-3xl overflow-hidden bg-olive text-white shadow-[0_-8px_32px_rgba(74,82,64,0.12)]"
    >
      <div className="container-kabishop pt-12 pb-10 sm:pt-16 sm:pb-14 md:pt-20 md:pb-16 lg:pt-24 lg:pb-20">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-x-10 lg:gap-y-8 xl:gap-x-12">
          {/* Marque */}
          <div className="lg:col-span-4 space-y-6 pr-0 sm:pr-4">
            <Link href="/" className="inline-block font-serif text-2xl font-bold tracking-tight">
              KabiShop
            </Link>
            <p className="text-sm leading-relaxed text-white/70 max-w-sm">
              Parfums, huiles pour la peau et crèmes corporelles à Conakry. Livraison rapide,
              paiement sécurisé Mobile Money & CinetPay.
            </p>
            <div className="flex gap-2">
              {SOCIAL.map(({ label, href, icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white/80 transition hover:bg-white/20 hover:text-white"
                >
                  {icon}
                </a>
              ))}
            </div>
            <div className="space-y-2 text-sm text-white/70">
              <p className="flex items-center gap-2">
                <MapPin className="h-4 w-4 shrink-0 text-white/50" />
                Conakry, Guinée
              </p>
              <a
                href={`https://wa.me/${WHATSAPP}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 hover:text-white transition"
              >
                <MessageCircle className="h-4 w-4 shrink-0 text-white/50" />
                WhatsApp
              </a>
              <a
                href="mailto:contact@kabishop.com"
                className="flex items-center gap-2 hover:text-white transition"
              >
                <Mail className="h-4 w-4 shrink-0 text-white/50" />
                contact@kabishop.com
              </a>
            </div>
          </div>

          {/* Liens */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-8 gap-y-10 sm:gap-x-10 lg:col-span-5">
            <FooterLinks title="Boutique" links={boutiqueLinks} />
            <FooterLinks title="Aide" links={AIDE_LINKS} />
            <FooterLinks title="Mon compte" links={COMPTE_LINKS} />
          </div>

          {/* Newsletter compacte */}
          <div className="lg:col-span-3 lg:pr-4">
            <h4 className="text-[11px] font-bold uppercase tracking-[0.15em] text-white/50 mb-5">
              Newsletter
            </h4>
            <p className="text-sm text-white/70 mb-5 leading-relaxed">
              -10% sur votre première commande. Offres et nouveautés.
            </p>
            <form className="space-y-3">
              <input
                type="email"
                placeholder="Votre e-mail"
                className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/40 outline-none focus:border-white/40 focus:bg-white/15"
              />
              <button
                type="button"
                className="w-full rounded-xl bg-white py-3 text-sm font-semibold text-olive hover:bg-cream transition"
              >
                S&apos;inscrire
              </button>
            </form>
            <p className="mt-5 text-[11px] text-white/40 leading-relaxed">
              Visa · Orange Money · MTN MoMo · CinetPay
            </p>
          </div>
        </div>
      </div>

      {/* Barre copyright */}
      <div className="border-t border-white/10">
        <div className="container-kabishop px-8 sm:px-10 md:px-12 lg:px-14 py-7 md:py-8 flex flex-col-reverse sm:flex-row items-center justify-between gap-4 text-[11px] text-white/50">
          <p>&copy; {year} KabiShop. Tous droits réservés.</p>
          <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1" aria-label="Liens légaux">
            <Link href="/apropos" className="hover:text-white transition">
              À propos
            </Link>
            <Link href="/produits" className="hover:text-white transition">
              Catalogue
            </Link>
            <Link href="/admin" className="hover:text-white transition">
              Admin
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
