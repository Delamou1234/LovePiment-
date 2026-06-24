import Link from 'next/link';
import { MapPin, Package, Phone } from 'lucide-react';
import { BrandLogo } from '@/shared/ui/BrandLogo';
import {
  getShopPhoneDisplay,
  getShopTelHref,
  getShopWhatsAppHref,
} from '@/shared/lib/shop-contact';

const FACEBOOK = process.env.NEXT_PUBLIC_FACEBOOK_PAGE_URL ?? 'https://facebook.com/lovepiment';

const INFO_LINKS = [
  { label: 'À propos de nous', href: '/apropos' },
  { label: 'Livraison & retours', href: '/apropos' },
  { label: 'Conditions générales', href: '/contact' },
  { label: 'Politique de confidentialité', href: '/contact' },
  { label: 'FAQ', href: '/contact' },
];

const COMPTE_LINKS = [
  { label: 'Mon compte', href: '/compte' },
  { label: 'Mes commandes', href: '/compte' },
  { label: 'Mes adresses', href: '/compte' },
  { label: 'Mes favoris', href: '/compte' },
  { label: 'Panier', href: '/panier' },
];

const AIDE_LINKS = [
  { label: 'Nous contacter', href: '/contact' },
  { label: 'Support 7j/7', href: '/messages' },
  { label: 'Suivi de commande', href: '/compte' },
  { label: 'Guide d\'utilisation', href: '/apropos' },
];

const SOCIAL = [
  { label: 'Instagram', href: 'https://instagram.com/lovepiment', abbr: 'IG' },
  { label: 'Facebook', href: FACEBOOK, abbr: 'FB' },
  { label: 'TikTok', href: 'https://tiktok.com', abbr: 'TT' },
  { label: 'Snapchat', href: 'https://snapchat.com', abbr: 'SC' },
];

const PAYMENTS = ['Visa', 'MC', 'PayPal', 'Apple Pay'];

function FooterCol({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  return (
    <div className="lp-footer-col">
      <h4 className="lp-footer-col-title">{title}</h4>
      <ul className="lp-footer-link-list">
        {links.map(({ label, href }) => (
          <li key={label}>
            <Link href={href} className="lp-footer-link">
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
  const telHref = getShopTelHref();
  const waHref = getShopWhatsAppHref();
  const phoneDisplay = getShopPhoneDisplay();
  const categoryLinks =
    boutiqueLinks.length > 0
      ? boutiqueLinks.slice(0, 6)
      : [
          { label: 'Sextoys', href: '/produits?categorie=sextoys' },
          { label: 'Lingerie sexy', href: '/produits?categorie=lingerie' },
          { label: 'Lubrifiants', href: '/produits?categorie=lubrifiants' },
          { label: 'Accessoires', href: '/produits?categorie=accessoires' },
        ];

  return (
    <footer className="lp-footer mt-auto">
      <div className="lp-footer-inner">
        <div className="lp-footer-grid">
          <div className="lp-footer-brand-col">
            <BrandLogo href="/" size="md" />
            <p className="lp-footer-desc">
              Votre boutique intime dédiée au plaisir et au bien-être féminin. Produits premium,
              livraison discrète à Conakry.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {SOCIAL.map(({ label, href, abbr }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="lp-footer-social"
                >
                  {abbr}
                </a>
              ))}
            </div>
          </div>

          <FooterCol title="Informations" links={INFO_LINKS} />
          <FooterCol title="Mon compte" links={COMPTE_LINKS} />

          <div className="lp-footer-col">
            <h4 className="lp-footer-col-title">Catégories</h4>
            <ul className="lp-footer-link-list">
              {categoryLinks.map(({ label, href }) => (
                <li key={label}>
                  <Link href={href} className="lp-footer-link">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="lp-footer-col">
            <h4 className="lp-footer-col-title">Aide & contact</h4>
            <ul className="lp-footer-link-list">
              {AIDE_LINKS.map(({ label, href }) => (
                <li key={label}>
                  <Link href={href} className="lp-footer-link">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>

            <h4 className="lp-footer-col-title lp-footer-col-title--spaced">Paiement sécurisé</h4>
            <div className="flex flex-wrap gap-2">
              {PAYMENTS.map((p) => (
                <span key={p} className="lp-footer-pay-badge">
                  {p}
                </span>
              ))}
            </div>

            <div className="lp-footer-discreet">
              <p className="flex items-center gap-2 text-xs font-semibold text-[#ff6eb4]">
                <Package className="h-4 w-4 shrink-0" />
                Livraison discrète
              </p>
              <p className="mt-1 text-[11px] leading-relaxed text-white/55">
                Emballage neutre, sans indication du contenu.
              </p>
            </div>

            <p className="mt-4 flex items-center gap-2 text-xs text-white/50">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              Conakry, Guinée
            </p>
            <a
              href={telHref}
              className="mt-2 flex items-center gap-2 text-xs text-white/60 transition hover:text-white"
            >
              <Phone className="h-3.5 w-3.5 shrink-0" />
              {phoneDisplay}
            </a>
            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 block text-xs text-white/50 transition hover:text-white"
            >
              WhatsApp support
            </a>
          </div>
        </div>
      </div>

      <div className="lp-footer-bottom">
        <div className="lp-footer-bottom-inner">
          <p>&copy; {year} Love Piment& — Tous droits réservés.</p>
          <div className="flex items-center gap-3 text-center sm:text-right">
            <span>Site réservé aux personnes majeures (18+)</span>
            <span className="lp-footer-18" aria-label="18 ans et plus">
              18+
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
