import { Heart, Package, Percent, Star } from 'lucide-react';

type Props = {
  clientesCount: number;
  promoCount: number;
  categoryCount: number;
  avisCount: number;
};

function formatCount(n: number): string {
  if (n >= 1000) return `+${Math.floor(n / 100) * 100}`;
  if (n > 0) return `${n}`;
  return '1000+';
}

export function LandingSocialProof({ clientesCount, promoCount, categoryCount, avisCount }: Props) {
  const stats = [
    {
      icon: Heart,
      value: formatCount(clientesCount || 1200),
      label: 'clientes satisfaites',
    },
    {
      icon: Package,
      value: categoryCount > 0 ? `${categoryCount}` : '6+',
      label: 'univers du plaisir',
    },
    {
      icon: Percent,
      value: promoCount > 0 ? `${promoCount}` : '—',
      label: promoCount > 0 ? 'promos en cours' : 'offres à venir',
    },
    {
      icon: Star,
      value: avisCount > 0 ? `${avisCount}` : '5★',
      label: avisCount > 0 ? 'avis vérifiés' : 'qualité premium',
    },
  ];

  return (
    <section className="lp-social-proof" aria-label="Chiffres clés Love Piment&">
      <div className="container-shop">
        <ul className="lp-social-proof-grid">
          {stats.map(({ icon: Icon, value, label }) => (
            <li key={label} className="lp-social-proof-item">
              <span className="lp-social-proof-icon" aria-hidden>
                <Icon className="h-5 w-5" strokeWidth={1.65} />
              </span>
              <div>
                <p className="lp-social-proof-value">{value}</p>
                <p className="lp-social-proof-label">{label}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
