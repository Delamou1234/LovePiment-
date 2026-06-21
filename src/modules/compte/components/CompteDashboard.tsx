'use client';

import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowUpRight,
  CheckCircle2,
  Crown,
  Heart,
  Mail,
  MapPin,
  MessageSquare,
  Package,
  Phone,
  Shield,
  ShoppingBag,
  Star,
  Truck,
  Wallet,
} from 'lucide-react';
import { CompteAvatarUpload } from './CompteAvatarUpload';
import {
  COMPTE_BTN_PRIMARY,
  COMPTE_CARD,
  COMPTE_WIDGET_LINK,
  STATUT_LABELS,
  STATUT_STYLES,
  VIP_NEXT_TIER,
  VIP_POINTS_THRESHOLD,
} from './compte-ui';
import type {
  CustomerAddress,
  CustomerOrderResume,
  CustomerProfile,
  WishlistItemClient,
} from '@/modules/compte/types';

type Props = {
  profil: CustomerProfile;
  commandes: CustomerOrderResume[];
  wishlist: WishlistItemClient[];
  adresses: CustomerAddress[];
  avisEnAttente: number;
  onEditProfil: () => void;
  onProfilUpdate: (p: CustomerProfile) => void;
  onVoirCommandes: () => void;
  onVoirFavoris: () => void;
  onVoirAdresses: () => void;
  onVoirProfil: () => void;
  onVoirFidelite: () => void;
};

function StatCard({
  icon: Icon,
  label,
  value,
  iconClass,
  onClick,
}: {
  icon: typeof Package;
  label: string;
  value: string | number;
  iconClass: string;
  onClick?: () => void;
}) {
  return (
    <div className={`${COMPTE_CARD} p-4 flex flex-col gap-3`}>
      <div className="flex items-start justify-between">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconClass}`}>
          <Icon className="h-5 w-5" />
        </div>
        {onClick && (
          <button type="button" onClick={onClick} className={COMPTE_WIDGET_LINK}>
            Voir tout
          </button>
        )}
      </div>
      <div>
        <p className="text-2xl font-bold text-zinc-900">{value}</p>
        <p className="text-xs text-zinc-500 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

export function CompteDashboard({
  profil,
  commandes,
  wishlist,
  adresses,
  avisEnAttente,
  onEditProfil,
  onProfilUpdate,
  onVoirCommandes,
  onVoirFavoris,
  onVoirAdresses,
  onVoirProfil,
  onVoirFidelite,
}: Props) {
  const isVip = profil.pointsFidelite >= VIP_POINTS_THRESHOLD;
  const enCours = commandes.filter((c) => !['LIVREE', 'ANNULEE'].includes(c.statut)).length;
  const recentOrders = commandes.slice(0, 5);
  const favoritePreview = wishlist.slice(0, 4);
  const defaultAddress = adresses.find((a) => a.parDefaut) ?? adresses[0];
  const progressPct = Math.min(100, (profil.pointsFidelite / VIP_NEXT_TIER) * 100);

  const memberSince = new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(profil.inscritLe));

  const activities = commandes.slice(0, 4).map((cmd) => ({
    id: cmd.id,
    label:
      cmd.statut === 'LIVREE'
        ? 'Commande livrée'
        : cmd.statut === 'EXPEDIEE'
          ? 'Commande expédiée'
          : cmd.statut === 'PAYEE'
            ? 'Paiement confirmé'
            : 'Commande en cours',
    detail: `#${cmd.id.slice(0, 8).toUpperCase()} · ${cmd.montantTotal.toLocaleString('fr-FR')} GN`,
    date: new Date(cmd.createdAt),
  }));

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Carte profil principale */}
      <div className={`${COMPTE_CARD} overflow-hidden`}>
        <div className="p-5 md:p-6 lg:p-8">
          <div className="flex flex-col xl:flex-row xl:items-start gap-6">
            <CompteAvatarUpload
              profil={profil}
              onProfilUpdate={onProfilUpdate}
              size="xl"
              variant="compact"
              showRemove={false}
            />

            <div className="flex-1 min-w-0 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-serif text-2xl md:text-3xl font-bold text-zinc-900">{profil.nom}</h1>
                {isVip && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-olive/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-olive">
                    <Crown className="h-3 w-3" />
                    VIP
                  </span>
                )}
              </div>
              <div className="flex flex-col sm:flex-row sm:flex-wrap gap-x-6 gap-y-2 text-sm text-zinc-600">
                <span className="inline-flex items-center gap-2">
                  <Mail className="h-4 w-4 text-zinc-400" />
                  {profil.email}
                </span>
                {profil.telephone && (
                  <span className="inline-flex items-center gap-2">
                    <Phone className="h-4 w-4 text-zinc-400" />
                    {profil.telephone}
                  </span>
                )}
                <span className="inline-flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-zinc-400" />
                  {profil.villePreferee ?? 'Conakry'}, Guinée
                </span>
              </div>
              <button type="button" onClick={onEditProfil} className={COMPTE_BTN_PRIMARY}>
                Modifier le profil
              </button>
            </div>

            <div className="xl:w-72 shrink-0 rounded-2xl bg-gradient-to-br from-olive to-olive-dark p-5 text-white shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/70">
                  Fidélité
                </span>
                {isVip && <Crown className="h-5 w-5 text-white/80" />}
              </div>
              <p className="font-serif text-3xl font-bold mt-2">{profil.pointsFidelite}</p>
              <p className="text-xs text-white/75 mt-0.5">points disponibles</p>
              <div className="mt-4">
                <div className="flex justify-between text-[10px] text-white/70 mb-1">
                  <span>{profil.pointsFidelite} pts</span>
                  <span>{VIP_NEXT_TIER} pts</span>
                </div>
                <div className="h-2 rounded-full bg-white/20 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-white transition-all"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>
              <button type="button" onClick={onVoirFidelite} className="mt-4 text-xs font-semibold text-white/90 hover:text-white">
                Voir mes avantages →
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 border-t border-beige-border/80 bg-cream/40">
          {[
            { label: 'Membre depuis', value: memberSince },
            { label: 'Commandes', value: String(profil.stats.commandes) },
            { label: 'Statut du compte', value: 'Vérifié', icon: CheckCircle2 },
            { label: 'Langue', value: 'Français' },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="px-4 py-4 md:px-6 md:py-5 border-b md:border-b-0 border-beige-border/60 md:border-r last:border-r-0">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">{label}</p>
              <p className="mt-1 text-sm font-semibold text-zinc-900 flex items-center gap-1.5">
                {Icon && <Icon className="h-4 w-4 text-emerald-600" />}
                {value}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Stats rapides */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 md:gap-4">
        <StatCard icon={Package} label="Commandes" value={profil.stats.commandes} iconClass="bg-violet-50 text-violet-700" onClick={onVoirCommandes} />
        <StatCard icon={Truck} label="En cours" value={enCours} iconClass="bg-amber-50 text-amber-700" onClick={onVoirCommandes} />
        <StatCard icon={Heart} label="Favoris" value={wishlist.length} iconClass="bg-red-50 text-red-600" onClick={onVoirFavoris} />
        <StatCard icon={Wallet} label="Total dépensé" value={`${(profil.stats.totalDepense / 1000).toFixed(0)}k GN`} iconClass="bg-emerald-50 text-emerald-700" />
        <StatCard icon={Star} label="Points fidélité" value={profil.pointsFidelite} iconClass="bg-sky-50 text-sky-700" onClick={onVoirFidelite} />
        <StatCard icon={MessageSquare} label="Avis à publier" value={avisEnAttente} iconClass="bg-pink-50 text-pink-600" />
      </div>

      {/* Grille principale */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          {/* Commandes récentes */}
          <div className={`${COMPTE_CARD}`}>
            <div className="flex items-center justify-between px-5 py-4 md:px-6 border-b border-beige-border/60">
              <h2 className="font-serif text-lg font-bold text-zinc-900">Commandes récentes</h2>
              <button type="button" onClick={onVoirCommandes} className={COMPTE_WIDGET_LINK}>
                Voir tout
              </button>
            </div>
            {recentOrders.length === 0 ? (
              <p className="p-6 text-sm text-zinc-500">Aucune commande pour le moment.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-beige-border/60 text-left text-[11px] uppercase tracking-wide text-zinc-400">
                      <th className="px-5 py-3 font-semibold md:px-6">N° commande</th>
                      <th className="px-3 py-3 font-semibold hidden sm:table-cell">Date</th>
                      <th className="px-3 py-3 font-semibold">Montant</th>
                      <th className="px-3 py-3 font-semibold">Statut</th>
                      <th className="px-5 py-3 font-semibold md:px-6 text-right">Détails</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map((cmd) => (
                      <tr key={cmd.id} className="border-b border-beige-border/40 last:border-0 hover:bg-cream/50">
                        <td className="px-5 py-3.5 md:px-6 font-medium text-zinc-900">
                          #{cmd.id.slice(0, 8).toUpperCase()}
                        </td>
                        <td className="px-3 py-3.5 text-zinc-500 hidden sm:table-cell">
                          {new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(cmd.createdAt))}
                        </td>
                        <td className="px-3 py-3.5 font-semibold text-zinc-900">
                          {cmd.montantTotal.toLocaleString('fr-FR')} GN
                        </td>
                        <td className="px-3 py-3.5">
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ring-1 ring-inset ${STATUT_STYLES[cmd.statut] ?? STATUT_STYLES.EN_ATTENTE}`}>
                            {STATUT_LABELS[cmd.statut] ?? cmd.statut}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 md:px-6 text-right">
                          {cmd.suiviToken ? (
                            <Link href={`/suivi/${cmd.suiviToken}`} className={COMPTE_WIDGET_LINK}>
                              Suivre
                            </Link>
                          ) : (
                            <button type="button" onClick={onVoirCommandes} className={COMPTE_WIDGET_LINK}>
                              Voir
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Favoris */}
          <div className={`${COMPTE_CARD}`}>
            <div className="flex items-center justify-between px-5 py-4 md:px-6 border-b border-beige-border/60">
              <h2 className="font-serif text-lg font-bold text-zinc-900">Mes favoris</h2>
              <button type="button" onClick={onVoirFavoris} className={COMPTE_WIDGET_LINK}>
                Voir tout
              </button>
            </div>
            {favoritePreview.length === 0 ? (
              <div className="p-8 text-center">
                <Heart className="mx-auto h-8 w-8 text-zinc-300 mb-2" />
                <p className="text-sm text-zinc-500">Aucun favori enregistré.</p>
                <Link href="/produits" className={`mt-3 inline-flex ${COMPTE_WIDGET_LINK}`}>
                  Explorer le catalogue →
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 md:p-5">
                {favoritePreview.map((item) => (
                  <Link
                    key={item.id}
                    href={`/produits/${item.product.slug}`}
                    className="group rounded-xl border border-beige-border bg-cream/30 p-3 transition hover:shadow-md hover:bg-white"
                  >
                    <div className="relative aspect-square rounded-lg overflow-hidden bg-beige mb-2">
                      {item.product.image && (
                        <Image src={item.product.image} alt="" fill sizes="120px" className="object-cover" />
                      )}
                      <span className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-white/90 shadow-sm">
                        <Heart className="h-3 w-3 fill-red-500 text-red-500" />
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-zinc-900 line-clamp-2 group-hover:text-olive transition-colors">
                      {item.product.nom}
                    </p>
                    <p className="text-xs font-bold text-zinc-900 mt-1">
                      {(item.product.prixPromo ?? item.product.prix).toLocaleString('fr-FR')} GN
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Activité récente */}
          <div className={`${COMPTE_CARD}`}>
            <div className="px-5 py-4 md:px-6 border-b border-beige-border/60">
              <h2 className="font-serif text-lg font-bold text-zinc-900">Activité récente</h2>
            </div>
            <ul className="divide-y divide-beige-border/60">
              {activities.length === 0 ? (
                <li className="p-6 text-sm text-zinc-500">Aucune activité récente.</li>
              ) : (
                activities.map((a) => (
                  <li key={a.id} className="flex items-start gap-3 px-5 py-4 md:px-6">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-olive-light text-olive">
                      <Package className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-zinc-900">{a.label}</p>
                      <p className="text-xs text-zinc-500 mt-0.5">{a.detail}</p>
                    </div>
                    <span className="text-[11px] text-zinc-400 shrink-0">
                      {new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' }).format(a.date)}
                    </span>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>

        {/* Colonne droite */}
        <div className="space-y-6">
          {/* Adresses */}
          <div className={`${COMPTE_CARD} p-5 md:p-6`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-serif text-base font-bold text-zinc-900">Adresses</h2>
              <button type="button" onClick={onVoirAdresses} className={COMPTE_WIDGET_LINK}>
                Gérer
              </button>
            </div>
            {defaultAddress ? (
              <div className="rounded-xl bg-cream border border-beige-border p-4">
                <p className="text-sm font-semibold text-zinc-900">
                  {defaultAddress.label || 'Adresse principale'}
                  {defaultAddress.parDefaut && (
                    <span className="ml-2 text-[10px] font-bold uppercase text-olive">Défaut</span>
                  )}
                </p>
                <p className="text-sm text-zinc-600 mt-2 leading-relaxed">{defaultAddress.adresse}</p>
                <p className="text-sm text-zinc-500 mt-1">{defaultAddress.ville}</p>
                {defaultAddress.telephone && (
                  <p className="text-xs text-zinc-400 mt-2">{defaultAddress.telephone}</p>
                )}
              </div>
            ) : (
              <p className="text-sm text-zinc-500">Aucune adresse enregistrée.</p>
            )}
          </div>

          {/* Paiements acceptés */}
          <div className={`${COMPTE_CARD} p-5 md:p-6`}>
            <h2 className="font-serif text-base font-bold text-zinc-900 mb-4">Moyens de paiement</h2>
            <ul className="space-y-2">
              {['Orange Money', 'MTN MoMo', 'CinetPay', 'Paiement à la livraison'].map((m) => (
                <li
                  key={m}
                  className="flex items-center gap-3 rounded-xl border border-beige-border bg-cream/40 px-3 py-2.5 text-sm font-medium text-zinc-700"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-olive text-xs font-bold ring-1 ring-beige-border">
                    {m.slice(0, 2).toUpperCase()}
                  </span>
                  {m}
                </li>
              ))}
            </ul>
          </div>

          {/* Communication */}
          <div className={`${COMPTE_CARD} p-5 md:p-6`}>
            <h2 className="font-serif text-base font-bold text-zinc-900 mb-4">Communication</h2>
            <ul className="space-y-1">
              <li>
                <Link href="/compte/messages" className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm text-zinc-700 hover:bg-cream transition">
                  <span className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-olive" />
                    Messagerie
                  </span>
                  <ArrowUpRight className="h-4 w-4 text-zinc-400" />
                </Link>
              </li>
              <li>
                <Link href="/contact" className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm text-zinc-700 hover:bg-cream transition">
                  <span className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-olive" />
                    Support client
                  </span>
                  <ArrowUpRight className="h-4 w-4 text-zinc-400" />
                </Link>
              </li>
              <li>
                <Link href="/produits" className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm text-zinc-700 hover:bg-cream transition">
                  <span className="flex items-center gap-2">
                    <ShoppingBag className="h-4 w-4 text-olive" />
                    Continuer mes achats
                  </span>
                  <ArrowUpRight className="h-4 w-4 text-zinc-400" />
                </Link>
              </li>
            </ul>
          </div>

          {/* Sécurité */}
          <div className={`${COMPTE_CARD} p-5 md:p-6`}>
            <h2 className="font-serif text-base font-bold text-zinc-900 mb-4">Sécurité du compte</h2>
            <ul className="space-y-2 text-sm">
              <li>
                <button type="button" onClick={onVoirProfil} className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-zinc-700 hover:bg-cream transition text-left">
                  <Shield className="h-4 w-4 text-olive shrink-0" />
                  Changer le mot de passe
                </button>
              </li>
              <li className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-zinc-600">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                Compte vérifié
              </li>
              <li className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-zinc-600">
                <Mail className="h-4 w-4 text-zinc-400 shrink-0" />
                {profil.email}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
