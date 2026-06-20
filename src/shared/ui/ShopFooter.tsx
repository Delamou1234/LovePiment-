import Link from 'next/link';

const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
    <rect x="2" y="2" width="20" height="20" rx="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
  </svg>
);

const TikTokIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
  </svg>
);

export function ShopFooter() {
  return (
    <footer id="contact" className="bg-[#f0ebe3] border-t border-[#e0d8cc] text-zinc-600">
      <div className="container-kabishop py-12 md:py-14">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 lg:gap-6">
          {/* Col 1 — Marque */}
          <div className="col-span-2 md:col-span-3 lg:col-span-1 space-y-4">
            <span className="font-serif text-xl font-bold text-zinc-900">KabiShop.</span>
            <p id="apropos" className="text-xs leading-relaxed text-zinc-500 max-w-[220px]">
              Votre boutique mode & beauté à Conakry. Des produits sélectionnés avec soin,
              livraison rapide et paiement Mobile Money sécurisé.
            </p>
            <div className="flex gap-2.5 pt-1">
              {[
                { icon: FacebookIcon, href: process.env.NEXT_PUBLIC_FACEBOOK_PAGE_URL ?? 'https://facebook.com/kabishop', label: 'Facebook' },
                { icon: InstagramIcon, href: 'https://instagram.com/kabishop', label: 'Instagram' },
                { icon: TikTokIcon, href: '#', label: 'TikTok' },
              ].map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-[#d9d0c4] bg-white/60 text-zinc-500 hover:text-zinc-800 transition"
                >
                  <Icon />
                </a>
              ))}
            </div>
          </div>

          {/* Col 2 — Informations */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-900">Informations</h4>
            <ul className="space-y-2 text-xs">
              <li><Link href="/#apropos" className="hover:text-zinc-900 transition">À propos</Link></li>
              <li><Link href="/produits" className="hover:text-zinc-900 transition">Livraison</Link></li>
              <li><Link href="/produits" className="hover:text-zinc-900 transition">Retours</Link></li>
              <li><Link href="/produits?promo=1" className="hover:text-zinc-900 transition">Promotions</Link></li>
            </ul>
          </div>

          {/* Col 3 — Aide */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-900">Aide & Support</h4>
            <ul className="space-y-2 text-xs">
              <li><Link href="/#contact" className="hover:text-zinc-900 transition">FAQ</Link></li>
              <li><Link href="/commande/confirmation" className="hover:text-zinc-900 transition">Suivi commande</Link></li>
              <li>
                <a href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '224620000000'}`} className="hover:text-zinc-900 transition">
                  Contact
                </a>
              </li>
            </ul>
          </div>

          {/* Col 4 — Mon compte */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-900">Mon compte</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '224620000000'}`} className="hover:text-zinc-900 transition">
                  Connexion
                </a>
              </li>
              <li><Link href="/commande" className="hover:text-zinc-900 transition">Mes commandes</Link></li>
              <li><Link href="/panier" className="hover:text-zinc-900 transition">Mon panier</Link></li>
            </ul>
          </div>

          {/* Col 5 — Paiement */}
          <div className="space-y-3 col-span-2 md:col-span-1">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-900">Paiement sécurisé</h4>
            <div className="flex flex-wrap gap-2">
              {['Visa', 'Mastercard', 'CinetPay', 'Orange Money'].map((m) => (
                <span
                  key={m}
                  className="inline-flex items-center justify-center rounded border border-[#d9d0c4] bg-white/80 px-2.5 py-1.5 text-[9px] font-bold uppercase text-zinc-500 tracking-wide min-w-[52px] text-center"
                >
                  {m}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-[#e0d8cc] text-center">
          <p className="text-[11px] text-zinc-400">
            &copy; {new Date().getFullYear()} KabiShop. Tous droits réservés.
          </p>
        </div>
      </div>
    </footer>
  );
}
