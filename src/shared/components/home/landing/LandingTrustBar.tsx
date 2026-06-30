import { Gem, Headset, Package, ShieldCheck } from 'lucide-react';

const ITEMS = [
  {
    icon: Package,
    title: 'Livraison discrète',
    desc: 'Emballage neutre, sans logo ni mention sur le colis. Livraison rapide à Conakry et environs.',
  },
  {
    icon: ShieldCheck,
    title: 'Paiement sécurisé',
    desc: 'Orange Money (compte marchand). Transactions protégées, données strictement confidentielles.',
  },
  {
    icon: Gem,
    title: 'Produits de qualité',
    desc: 'Sélection soignée, matériaux body-safe et marques fiables pour votre bien-être intime.',
  },
  {
    icon: Headset,
    title: 'Support à l\'écoute',
    desc: 'Une équipe bienveillante sur WhatsApp et par téléphone, 7j/7 — en toute discrétion.',
  },
] as const;

export function LandingTrustBar() {
  return (
    <section className="lp-trust-bar" aria-labelledby="lp-trust-title">
      <div className="container-shop">
        <div className="lp-trust-intro">
          <p className="lp-trust-eyebrow">Notre promesse</p>
          <h2 id="lp-trust-title" className="lp-trust-heading">
            Une expérience intime, <span className="text-olive">en toute confiance</span>
          </h2>
          <p className="lp-trust-lead">
            Chez Love Piment&, chaque commande est traitée avec soin : discrétion, qualité et accompagnement
            personnalisé.
          </p>
        </div>

        <ul className="lp-trust-grid">
          {ITEMS.map(({ icon: Icon, title, desc }) => (
            <li key={title} className="lp-trust-item">
              <div className="lp-trust-icon" aria-hidden>
                <Icon className="h-6 w-6" strokeWidth={1.65} />
              </div>
              <div className="lp-trust-copy">
                <h3 className="lp-trust-title">{title}</h3>
                <p className="lp-trust-desc">{desc}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
