'use client';

import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  CreditCard,
  Headphones,
  Heart,
  MapPin,
  MessageSquare,
  Package,
  Shield,
  ShoppingCart,
  Star,
  Tag,
  Truck,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import {
  COMPTE_CARD,
  COMPTE_WIDGET_LINK,
  STATUT_LABELS,
  STATUT_STYLES,
  prenomClient,
} from './compte-ui';
import type {
  CustomerDashboardData,
  CustomerOrderResume,
  CustomerProfile,
} from '@/modules/compte/types';

type Props = {
  profil: CustomerProfile;
  commandes: CustomerOrderResume[];
  dashboard: CustomerDashboardData;
  onVoirCommandes: () => void;
  onVoirFavoris: () => void;
  onVoirAdresses: () => void;
  onVoirProfil: () => void;
  onVoirFidelite: () => void;
  onVoirAvis: () => void;
};

const SHORTCUTS = [
  { label: 'Mes adresses', icon: MapPin, action: 'adresses' as const },
  { label: 'Messagerie', icon: MessageSquare, href: '/compte/messages' },
  { label: 'Mes avis', icon: Star, action: 'avis' as const },
  { label: 'Mes offres', icon: Tag, action: 'fidelite' as const },
  { label: 'Mon profil', icon: CreditCard, action: 'profil' as const },
];

const KPI_ICON: Record<string, string> = {
  violet: 'is-purple',
  amber: 'is-amber',
  emerald: 'is-green',
  rose: 'is-pink',
  pink: 'is-pink',
};

function KpiTile({
  icon: Icon,
  label,
  value,
  href,
  onClick,
  iconTone,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  href?: string;
  onClick?: () => void;
  iconTone: keyof typeof KPI_ICON;
}) {
  const iconClass = KPI_ICON[iconTone] ?? 'is-pink';
  const content = (
    <div className="admin-dash-kpi h-full transition hover:border-zinc-300 hover:shadow-md">
      <div className={`admin-dash-kpi-icon ${iconClass}`}>
        <Icon className="h-5 w-5" strokeWidth={1.75} />
      </div>
      <div className="min-w-0">
        <p className="admin-dash-kpi-label">{label}</p>
        <p className="admin-dash-kpi-value">{value.toLocaleString('fr-FR')}</p>
      </div>
    </div>
  );

  if (href) {
    return <Link href={href} className="block">{content}</Link>;
  }

  return (
    <button type="button" onClick={onClick} className="block w-full text-left">
      {content}
    </button>
  );
}

export function CompteDashboard({
  profil,
  commandes,
  dashboard,
  onVoirCommandes,
  onVoirFavoris,
  onVoirAdresses,
  onVoirProfil,
  onVoirFidelite,
  onVoirAvis,
}: Props) {
  const { stats, recommandations, offreBienvenue } = dashboard;
  const recentOrders = commandes.slice(0, 4);
  const prenom = prenomClient(profil.nom);

  const shortcutAction = (action: 'adresses' | 'fidelite' | 'profil' | 'avis') => {
    if (action === 'adresses') onVoirAdresses();
    if (action === 'fidelite') onVoirFidelite();
    if (action === 'profil') onVoirProfil();
    if (action === 'avis') onVoirAvis();
  };

  return (
    <div className="compte-dashboard space-y-6 animate-fadeIn">
      <header className="compte-dash-hero">
        <h1 className="compte-dash-greeting">Bonjour, {prenom}</h1>
        <p className="compte-dash-welcome">
          Retrouvez vos commandes, vos avantages fidélité et vos favoris en un coup d&apos;œil.
        </p>
        {offreBienvenue && (
          <div className="compte-dash-welcome-offer">
            <Tag className="h-4 w-4 shrink-0" aria-hidden />
            <span>
              Code <strong>{offreBienvenue.code}</strong> — {offreBienvenue.titre}
            </span>
          </div>
        )}
      </header>

      <div className="admin-dash-kpi-grid">
        <KpiTile
          icon={Package}
          label="Commandes"
          value={stats.commandes}
          onClick={onVoirCommandes}
          iconTone="violet"
        />
        <KpiTile
          icon={Truck}
          label="En cours"
          value={stats.enCours}
          onClick={onVoirCommandes}
          iconTone="amber"
        />
        <KpiTile
          icon={Package}
          label="Livrées"
          value={stats.livrees}
          onClick={onVoirCommandes}
          iconTone="emerald"
        />
        <KpiTile
          icon={Heart}
          label="Favoris"
          value={stats.favoris}
          onClick={onVoirFavoris}
          iconTone="rose"
        />
        <KpiTile
          icon={Tag}
          label="Bons actifs"
          value={stats.bonsReduction}
          onClick={onVoirFidelite}
          iconTone="pink"
        />
      </div>

      <div className="compte-dash-grid">
        <section className={`${COMPTE_CARD} compte-dash-orders overflow-hidden`}>
          <div className="compte-dash-card-head">
            <h2 className="compte-dash-card-title">Mes dernières commandes</h2>
            <button type="button" onClick={onVoirCommandes} className={COMPTE_WIDGET_LINK}>
              Voir toutes <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {recentOrders.length === 0 ? (
            <div className="compte-dash-empty">
              <div className="compte-dash-empty-icon">
                <Package className="h-6 w-6" strokeWidth={1.5} />
              </div>
              <p className="text-sm font-semibold text-zinc-800">Aucune commande pour le moment</p>
              <p className="mt-1 text-xs text-zinc-500">Vos achats apparaîtront ici.</p>
              <Link href="/produits" className="compte-dash-empty-cta">
                Découvrir la boutique <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="compte-dash-table">
                <thead>
                  <tr>
                    <th>Commande</th>
                    <th className="hidden sm:table-cell">Date</th>
                    <th>Statut</th>
                    <th className="hidden md:table-cell">Montant</th>
                    <th className="text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((cmd) => (
                    <tr key={cmd.id}>
                      <td className="font-semibold text-zinc-900">
                        #{cmd.id.slice(0, 8).toUpperCase()}
                      </td>
                      <td className="hidden sm:table-cell text-zinc-500">
                        {new Intl.DateTimeFormat('fr-FR', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        }).format(new Date(cmd.createdAt))}
                      </td>
                      <td>
                        <span
                          className={`compte-dash-badge ${STATUT_STYLES[cmd.statut] ?? STATUT_STYLES.EN_ATTENTE}`}
                        >
                          {STATUT_LABELS[cmd.statut] ?? cmd.statut}
                        </span>
                      </td>
                      <td className="hidden md:table-cell font-semibold text-zinc-900">
                        {cmd.montantTotal.toLocaleString('fr-FR')} GNF
                      </td>
                      <td className="text-right">
                        {cmd.suiviToken ? (
                          <Link href={`/suivi/${cmd.suiviToken}`} className="compte-dash-detail-btn">
                            Détails
                          </Link>
                        ) : (
                          <button type="button" onClick={onVoirCommandes} className="compte-dash-detail-btn">
                            Détails
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <aside className="compte-dash-side">
          <section className={`${COMPTE_CARD} p-5`}>
            <h2 className="compte-dash-card-title mb-4">Raccourcis</h2>
            <div className="compte-dash-shortcuts">
              {SHORTCUTS.map((item) => {
                const Icon = item.icon;
                const inner = (
                  <>
                    <span className="compte-dash-shortcut-icon">
                      <Icon className="h-4 w-4" strokeWidth={1.75} />
                    </span>
                    <span>{item.label}</span>
                  </>
                );
                if ('href' in item && item.href) {
                  return (
                    <Link key={item.label} href={item.href} className="compte-dash-shortcut">
                      {inner}
                    </Link>
                  );
                }
                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => shortcutAction(item.action!)}
                    className="compte-dash-shortcut"
                  >
                    {inner}
                  </button>
                );
              })}
            </div>
          </section>

          <Link href="/produits" className={`${COMPTE_CARD} compte-dash-shop-card group`}>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Boutique
              </p>
              <p className="mt-1 text-sm font-bold text-zinc-900 group-hover:text-[#e91e8c] transition">
                Continuer mes achats
              </p>
            </div>
            <ShoppingCart className="h-5 w-5 text-zinc-400 group-hover:text-[#e91e8c] transition" />
          </Link>
        </aside>
      </div>

      {recommandations.length > 0 && (
        <section>
          <div className="compte-dash-card-head mb-5 px-0 border-0 pb-0">
            <h2 className="compte-dash-card-title">Recommandé pour vous</h2>
            <Link href="/produits" className={COMPTE_WIDGET_LINK}>
              Voir la boutique <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="compte-dash-products">
            {recommandations.map((p) => {
              const prix = p.prixPromo ?? p.prix;
              return (
                <article key={p.id} className={`${COMPTE_CARD} compte-dash-product overflow-hidden`}>
                  <Link href={`/produits/${p.slug}`} className="compte-dash-product-image">
                    {p.image ? (
                      <Image src={p.image} alt="" fill sizes="220px" className="object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-zinc-100 text-zinc-400">
                        <Heart className="h-8 w-8" />
                      </div>
                    )}
                  </Link>
                  <div className="p-4">
                    <Link
                      href={`/produits/${p.slug}`}
                      className="line-clamp-2 text-sm font-bold text-zinc-900 hover:text-[#e91e8c]"
                    >
                      {p.nom}
                    </Link>
                    <div className="mt-1 flex items-center gap-1 text-xs text-amber-500">
                      <Star className="h-3.5 w-3.5 fill-current" />
                      <span>{p.rating.toFixed(1)}</span>
                      {p.reviews > 0 && <span className="text-zinc-400">({p.reviews})</span>}
                    </div>
                    <p className="mt-2 text-base font-bold text-zinc-900">
                      {prix.toLocaleString('fr-FR')} GNF
                    </p>
                    <Link href={`/produits/${p.slug}`} className="compte-dash-cart-btn mt-3">
                      Voir le produit
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      <section className="compte-dash-trust">
        {[
          { icon: Truck, title: 'Livraison discrète', desc: 'Emballage neutre, sans indication.' },
          { icon: Shield, title: 'Paiement sécurisé', desc: 'Orange Money (compte marchand).' },
          { icon: Star, title: 'Qualité garantie', desc: 'Produits sélectionnés avec soin.' },
          { icon: Headphones, title: 'Support réactif', desc: 'Une équipe à votre écoute.' },
        ].map(({ icon: Icon, title, desc }) => (
          <div key={title} className={`${COMPTE_CARD} compte-dash-trust-item`}>
            <div className="compte-dash-trust-icon">
              <Icon className="h-4 w-4" strokeWidth={1.75} />
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-900">{title}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-zinc-500">{desc}</p>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
