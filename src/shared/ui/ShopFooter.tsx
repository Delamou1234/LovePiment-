import Link from 'next/link';
import { MapPin, Phone } from 'lucide-react';
import { BrandLogo } from '@/shared/ui/BrandLogo';
import {
  getShopPhoneDisplay,
  getShopTelHref,
  getShopWhatsAppHref,
} from '@/shared/lib/shop-contact';

const FACEBOOK = process.env.NEXT_PUBLIC_FACEBOOK_PAGE_URL ?? 'https://facebook.com/lovepiment';

const UTIL_LINKS = [
  { label: 'À propos', href: '/apropos' },
  { label: 'FAQ', href: '/faq' },
  { label: 'Promotions', href: '/promos' },
  { label: 'Mon compte', href: '/compte' },
  { label: 'Contact', href: '/contact' },
  { label: 'CGV', href: '/cgv' },
  { label: 'Confidentialité', href: '/confidentialite' },
];

const SOCIAL = [
  { label: 'Instagram', href: 'https://instagram.com/lovepiment', abbr: 'IG' },
  { label: 'Facebook', href: FACEBOOK, abbr: 'FB' },
  { label: 'TikTok', href: 'https://tiktok.com', abbr: 'TT' },
];

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
      ? boutiqueLinks.slice(0, 4)
      : [
          { label: 'Sextoys', href: '/produits?categorie=sextoys' },
          { label: 'Lingerie', href: '/produits?categorie=lingerie' },
          { label: 'Lubrifiants', href: '/produits?categorie=lubrifiants' },
          { label: 'Accessoires', href: '/produits?categorie=accessoires' },
        ];

  return (
    <footer className="lp-footer mt-auto">
      <div className="lp-footer-inner">
        <div className="lp-footer-grid">
          <div className="lp-footer-brand-col">
            <BrandLogo href="/" size="sm" />
            <p className="lp-footer-desc">
              Boutique intime à Conakry — livraison discrète, paiement Mobile Money.
            </p>
            <div className="lp-footer-social-row">
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

          <FooterCol title="Boutique" links={categoryLinks} />
          <FooterCol title="Liens utiles" links={UTIL_LINKS} />

          <div className="lp-footer-col">
            <h4 className="lp-footer-col-title">Contact</h4>
            <ul className="lp-footer-contact-list">
              <li>
                <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
                Conakry, Guinée
              </li>
              <li>
                <a href={telHref} className="lp-footer-contact-link">
                  <Phone className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  {phoneDisplay}
                </a>
              </li>
              <li>
                <a
                  href={waHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="lp-footer-contact-link"
                >
                  WhatsApp
                </a>
              </li>
            </ul>
            <p className="lp-footer-discreet-inline">
              Emballage neutre · Livraison discrète · 18+
            </p>
          </div>
        </div>
      </div>

      <div className="lp-footer-bottom">
        <div className="lp-footer-bottom-inner">
          <p>&copy; {year} Love Piment&</p>
          <p className="lp-footer-bottom-note">Réservé aux majeurs (18+)</p>
        </div>
      </div>
    </footer>
  );
}
