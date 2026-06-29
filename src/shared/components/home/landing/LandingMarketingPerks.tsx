import Link from 'next/link';
import { ArrowRight, Gift, MessageCircle, Sparkles, Users } from 'lucide-react';

const PERKS = [
  {
    icon: Gift,
    title: 'Points fidélité',
    desc: 'Cumulez des points à chaque commande et débloquez des réductions exclusives.',
    href: '/compte?section=fidelite',
    cta: 'Découvrir le programme',
  },
  {
    icon: Users,
    title: 'Parrainage',
    desc: 'Invitez une amie et profitez tous les deux d\'avantages sur votre prochaine commande.',
    href: '/inscription',
    cta: 'Parrainer',
  },
  {
    icon: MessageCircle,
    title: 'Conseil discret',
    desc: 'Une question ? Notre équipe vous répond en privé sur WhatsApp, sans jugement.',
    href: '/contact',
    cta: 'Nous contacter',
  },
  {
    icon: Sparkles,
    title: 'Offres exclusives',
    desc: 'Ventes flash, codes promo et nouveautés réservées aux membres inscrits.',
    href: '/promos',
    cta: 'Voir les promos',
  },
] as const;

export function LandingMarketingPerks() {
  return (
    <section className="lp-perks" aria-labelledby="lp-perks-title">
      <div className="container-shop">
        <div className="lp-perks-header">
          <p className="lp-perks-eyebrow">Avantages membres</p>
          <h2 id="lp-perks-title" className="lp-perks-title">
            Plus qu&apos;une boutique,{' '}
            <span className="text-olive">une expérience</span>
          </h2>
          <p className="lp-perks-lead">
            Inscrivez-vous gratuitement et profitez d&apos;avantages pensés pour vous accompagner à chaque étape.
          </p>
        </div>

        <ul className="lp-perks-grid">
          {PERKS.map(({ icon: Icon, title, desc, href, cta }) => (
            <li key={title} className="lp-perks-card">
              <div className="lp-perks-icon" aria-hidden>
                <Icon className="h-6 w-6" strokeWidth={1.65} />
              </div>
              <h3 className="lp-perks-card-title">{title}</h3>
              <p className="lp-perks-card-desc">{desc}</p>
              <Link href={href} className="group lp-perks-card-link">
                {cta}
                <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
