'use client';

import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  Bell,
  ChevronRight,
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
import { DashboardHomeButton } from '@/shared/ui/DashboardHomeButton';

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
  { label: 'Mes avis', icon: Star, action: 'avis' as const },
  { label: 'Messagerie', icon: MessageSquare, href: '/compte/messages' },
  { label: 'Mes offres', icon: Tag, action: 'fidelite' as const },
  { label: 'Paramètres', icon: CreditCard, action: 'profil' as const },
  { label: 'Boutique', icon: ShoppingCart, href: '/produits' },
];

function StatTile({
  icon: Icon,
  label,
  value,
  href,
  onClick,
  iconClass,
}: {
  icon: typeof Package;
  label: string;
  value: number;
  href?: string;
  onClick?: () => void;
  iconClass: string;
}) {
  const content = (
    <div className={`compte-dash-stat ${COMPTE_CARD}`}>
      <div className={`compte-dash-stat-icon ${iconClass}`}>
        <Icon className="h-5 w-5" strokeWidth={1.75} />
      </div>
      <p className="compte-dash-stat-value">{value}</p>
      <p className="compte-dash-stat-label">{label}</p>
      <span className="compte-dash-stat-link">
        Voir <ArrowRight className="h-3 w-3" />
      </span>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block transition hover:-translate-y-0.5">
        {content}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className="block w-full text-left transition hover:-translate-y-0.5">
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

  const shortcutAction = (action: 'adresses' | 'avis' | 'fidelite' | 'profil') => {
    if (action === 'adresses') onVoirAdresses();
    if (action === 'avis') onVoirAvis();
    if (action === 'fidelite') onVoirFidelite();
    if (action === 'profil') onVoirProfil();
  };

  return (
    <div className="compte-dashboard space-y-8 animate-fadeIn">
      <header className="compte-dash-header">
        <div>
          <h1 className="compte-dash-greeting">
            Bonjour, {prenom} <span aria-hidden>👋</span>
          </h1>
          <p className="compte-dash-welcome">
            Bienvenue dans votre espace intime Love Piment&. Gérez vos commandes et vos envies en toute
            discrétion.
          </p>
        </div>
        <div className="compte-dash-header-actions">
          <DashboardHomeButton />
          <button
            type="button"
            className="compte-dash-bell"
            aria-label={`${stats.notifications} notifications`}
            onClick={onVoirAvis}
          >
            <Bell className="h-5 w-5" />
            {stats.notifications > 0 && (
              <span className="compte-dash-bell-badge">{stats.notifications}</span>
            )}
          </button>
          <button type="button" onClick={onVoirProfil} className="compte-dash-profile">
            <span className="compte-dash-profile-name">{profil.nom}</span>
            <ChevronRight className="h-4 w-4 shrink-0 text-zinc-500" />
          </button>
        </div>
      </header>

      <div className="compte-dash-stats">
        <StatTile
          icon={Package}
          label="Commandes"
          value={stats.commandes}
          onClick={onVoirCommandes}
          iconClass="is-violet"
        />
        <StatTile
          icon={Truck}
          label="En cours"
          value={stats.enCours}
          onClick={onVoirCommandes}
          iconClass="is-amber"
        />
        <StatTile
          icon={Package}
          label="Livrées"
          value={stats.livrees}
          onClick={onVoirCommandes}
          iconClass="is-emerald"
        />
        <StatTile
          icon={Heart}
          label="Favoris"
          value={stats.favoris}
          onClick={onVoirFavoris}
          iconClass="is-rose"
        />
        <StatTile
          icon={Tag}
          label="Bons de réduction"
          value={stats.bonsReduction}
          onClick={onVoirFidelite}
          iconClass="is-pink"
        />
      </div>

      <div className="compte-dash-grid">
        <section className={`${COMPTE_CARD} compte-dash-orders`}>
          <div className="compte-dash-card-head">
            <h2 className="compte-dash-card-title">Mes dernières commandes</h2>
            <button type="button" onClick={onVoirCommandes} className={COMPTE_WIDGET_LINK}>
              Voir toutes <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {recentOrders.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <Package className="mx-auto h-10 w-10 text-zinc-300" strokeWidth={1.5} />
              <p className="mt-3 text-sm font-medium text-zinc-700">Aucune commande pour le moment</p>
              <p className="mt-1 text-xs text-zinc-500">Vos achats apparaîtront ici.</p>
              <Link
                href="/produits"
                className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[#e91e8c] hover:text-[#b8105f]"
              >
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
                const className = 'compte-dash-shortcut';
                if ('href' in item && item.href) {
                  return (
                    <Link key={item.label} href={item.href} className={className}>
                      <Icon className="h-5 w-5 text-[#e91e8c]" strokeWidth={1.75} />
                      <span>{item.label}</span>
                    </Link>
                  );
                }
                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => shortcutAction(item.action!)}
                    className={className}
                  >
                    <Icon className="h-5 w-5 text-[#e91e8c]" strokeWidth={1.75} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </section>

          {offreBienvenue && (
            <section className="compte-dash-promo">
              <p className="text-sm font-semibold text-white/90">Votre moment plaisir</p>
              <p className="mt-2 font-serif text-2xl font-bold leading-snug text-white">
                Plus vous prenez soin de vous, plus vous méritez le meilleur.
              </p>
              <p className="mt-3 text-xs text-white/80">
                Code <strong className="text-white">{offreBienvenue.code}</strong> — {offreBienvenue.titre}
              </p>
              <Link href="/produits" className="compte-dash-promo-btn">
                Découvrir la boutique
              </Link>
              <div className="compte-dash-promo-img" aria-hidden>
                <Image
                  src="/images/hero-love-piment.png"
                  alt=""
                  width={200}
                  height={140}
                  className="h-full w-full object-cover object-[75%_center] opacity-90"
                />
              </div>
            </section>
          )}
        </aside>
      </div>

      {recommandations.length > 0 && (
        <section>
          <div className="compte-dash-card-head mb-5">
            <h2 className="compte-dash-card-title">Recommandé pour vous</h2>
            <Link href="/produits" className={COMPTE_WIDGET_LINK}>
              Voir la boutique <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="compte-dash-products">
            {recommandations.map((p) => {
              const prix = p.prixPromo ?? p.prix;
              return (
                <article key={p.id} className={`${COMPTE_CARD} compte-dash-product`}>
                  <Link href={`/produits/${p.slug}`} className="compte-dash-product-image">
                    {p.image ? (
                      <Image src={p.image} alt="" fill sizes="220px" className="object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-[#fce4ef] text-[#e91e8c]">
                        <Heart className="h-8 w-8" />
                      </div>
                    )}
                  </Link>
                  <div className="p-4">
                    <Link href={`/produits/${p.slug}`} className="line-clamp-2 text-sm font-bold text-zinc-900 hover:text-[#e91e8c]">
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
                      Ajouter au panier
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
          { icon: Truck, title: 'Livraison discrète', desc: 'Emballage neutre et sans indication.' },
          { icon: Shield, title: 'Paiement 100% sécurisé', desc: 'Transactions protégées.' },
          { icon: Star, title: 'Produits de qualité', desc: 'Matériaux sûrs et testés.' },
          { icon: Headphones, title: 'Support client 7j/7', desc: 'Une équipe à votre écoute.' },
        ].map(({ icon: Icon, title, desc }) => (
          <div key={title} className={`${COMPTE_CARD} compte-dash-trust-item`}>
            <div className="compte-dash-trust-icon">
              <Icon className="h-5 w-5 text-[#e91e8c]" strokeWidth={1.75} />
            </div>
            <div>
              <p className="text-sm font-bold text-zinc-900">{title}</p>
              <p className="mt-1 text-xs leading-relaxed text-zinc-500">{desc}</p>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
