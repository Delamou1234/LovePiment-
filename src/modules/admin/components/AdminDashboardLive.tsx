'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowUpRight,
  Banknote,
  Boxes,
  CheckCircle2,
  Mail,
  MessageSquare,
  Package,
  Radio,
  Settings,
  ShoppingBag,
  Tag,
  TrendingUp,
  Users,
} from 'lucide-react';
import type { AdminDashboardStats } from '@/modules/admin/services/admin-stats.service';
import {
  ADMIN_BTN_PRIMARY,
  ADMIN_CARD,
  ADMIN_WIDGET_LINK,
  type AdminSessionUser,
} from './admin-ui';
import { STATUT_LABELS, STATUT_STYLES } from '@/modules/compte/components/compte-ui';
import { useAdminMessagerieContext } from './AdminMessagerieProvider';

type RecentOrder = {
  id: string;
  clientNom: string;
  statut: string;
  montantTotal: number;
  createdAt: string;
  suiviToken?: string;
};

function formatGn(n: number) {
  return n.toLocaleString('fr-FR') + ' GN';
}

function formatHeure(date: Date) {
  return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function StatCard({
  icon: Icon,
  label,
  value,
  iconClass,
  href,
}: {
  icon: typeof Package;
  label: string;
  value: string | number;
  iconClass: string;
  href: string;
}) {
  return (
    <Link href={href} className={`${ADMIN_CARD} p-4 flex flex-col gap-3 transition hover:shadow-md`}>
      <div className="flex items-start justify-between">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconClass}`}>
          <Icon className="h-5 w-5" />
        </div>
        <span className={ADMIN_WIDGET_LINK}>Voir</span>
      </div>
      <div>
        <p className="text-2xl font-bold text-zinc-900">{value}</p>
        <p className="text-xs text-zinc-500 mt-0.5">{label}</p>
      </div>
    </Link>
  );
}

const QUICK_LINKS = [
  { label: 'Ajouter un produit', href: '/admin/produits' },
  { label: 'Traiter les commandes', href: '/admin/commandes' },
  { label: 'Business Intelligence', href: '/admin/bi' },
  { label: 'Rapports trafic', href: '/admin/trafic' },
  { label: 'Gérer les stocks', href: '/admin/stocks' },
];

interface AdminDashboardLiveProps {
  initialStats: AdminDashboardStats;
}

export function AdminDashboardLive({ initialStats }: AdminDashboardLiveProps) {
  const [stats, setStats] = useState(initialStats);
  const [admin, setAdmin] = useState<AdminSessionUser | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [connected, setConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [pulseKey, setPulseKey] = useState(0);
  const { conversations: clientMessages, totalUnread: messagesUnread } = useAdminMessagerieContext();
  const messagePreview = clientMessages.slice(0, 5);

  useEffect(() => {
    const es = new EventSource('/api/admin/stats/stream');

    es.onopen = () => setConnected(true);
    es.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === 'update' && payload.stats) {
          setStats(payload.stats);
          setLastUpdate(new Date(payload.at ?? Date.now()));
          setPulseKey((k) => k + 1);
        }
      } catch {
        /* ignore */
      }
    };
    es.onerror = () => setConnected(false);

    return () => es.close();
  }, []);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((data) => {
        if (data?.user?.role === 'admin') setAdmin(data.user);
      })
      .catch(() => {});

    fetch('/api/admin/commandes')
      .then((r) => r.json())
      .then((data) => setRecentOrders((data.commandes ?? []).slice(0, 5)))
      .catch(() => {});
  }, []);

  const adminName = admin?.name ?? 'Administrateur';
  const adminEmail = admin?.email ?? '';

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Carte admin principale */}
      <div className={`${ADMIN_CARD} overflow-hidden`}>
        <div className="p-5 md:p-6 lg:p-8">
          <div className="flex flex-col xl:flex-row xl:items-start gap-6">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-olive/10 text-xl font-bold text-olive">
              {adminName
                .split(/\s+/)
                .slice(0, 2)
                .map((p) => p[0]?.toUpperCase() ?? '')
                .join('') || 'A'}
            </div>

            <div className="flex-1 min-w-0 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-serif text-2xl md:text-3xl font-bold text-zinc-900">{adminName}</h1>
                <span className="inline-flex items-center gap-1 rounded-full bg-olive/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-olive">
                  Admin
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${
                    connected
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                      : 'border-zinc-200 bg-zinc-50 text-zinc-500'
                  }`}
                >
                  <Radio className={`h-3 w-3 ${connected ? 'animate-pulse' : ''}`} />
                  {connected ? 'Temps réel' : 'Reconnexion…'}
                </span>
              </div>
              {adminEmail && (
                <p className="inline-flex items-center gap-2 text-sm text-zinc-600">
                  <Mail className="h-4 w-4 text-zinc-400" />
                  {adminEmail}
                </p>
              )}
              <p className="text-sm text-zinc-500">
                {stats.commandesTotal} commande{stats.commandesTotal > 1 ? 's' : ''} au total
                {stats.commandesAujourdhui > 0 && (
                  <> · {stats.commandesAujourdhui} aujourd&apos;hui</>
                )}
              </p>
              <Link href="/admin/parametres" className={ADMIN_BTN_PRIMARY}>
                Paramètres boutique
              </Link>
            </div>

            <div className="xl:w-72 shrink-0 rounded-2xl bg-gradient-to-br from-olive to-olive-dark p-5 text-white shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/70">
                  Chiffre d&apos;affaires
                </span>
                <Banknote className="h-5 w-5 text-white/80" />
              </div>
              <p
                key={`ca-${pulseKey}`}
                className="font-serif text-3xl font-bold mt-2 transition-all duration-300"
              >
                {formatGn(stats.chiffreAffaires)}
              </p>
              <p className="text-xs text-white/75 mt-0.5">commandes payées et livrées</p>
              {lastUpdate && connected && (
                <p className="mt-4 text-[10px] text-white/60">
                  Dernière mise à jour · {formatHeure(lastUpdate)}
                </p>
              )}
              <Link
                href="/admin/bi"
                className="mt-4 inline-block text-xs font-semibold text-white/90 hover:text-white"
              >
                Voir les analyses →
              </Link>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 border-t border-beige-border/80 bg-cream/40">
          {[
            { label: 'Commandes totales', value: String(stats.commandesTotal) },
            { label: 'Aujourd\'hui', value: String(stats.commandesAujourdhui) },
            { label: 'Clients inscrits', value: String(stats.clientsUniques) },
            {
              label: 'Visites aujourd\'hui',
              value: String(stats.visitesAujourdhui),
              icon: CheckCircle2,
            },
          ].map(({ label, value, icon: Icon }) => (
            <div
              key={label}
              className="px-4 py-4 md:px-6 md:py-5 border-b md:border-b-0 border-beige-border/60 md:border-r last:border-r-0"
            >
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
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3 md:gap-4">
        <StatCard
          icon={Package}
          label="Produits actifs"
          value={stats.produitsActifs}
          iconClass="bg-violet-50 text-violet-700"
          href="/admin/produits"
        />
        <StatCard
          icon={ShoppingBag}
          label="En attente"
          value={stats.commandesEnAttente}
          iconClass="bg-amber-50 text-amber-700"
          href="/admin/commandes"
        />
        <StatCard
          icon={TrendingUp}
          label="Visites (7 j)"
          value={stats.visites7j}
          iconClass="bg-sky-50 text-sky-700"
          href="/admin/trafic"
        />
        <StatCard
          icon={Banknote}
          label="Chiffre d'affaires"
          value={`${(stats.chiffreAffaires / 1000).toFixed(0)}k GN`}
          iconClass="bg-emerald-50 text-emerald-700"
          href="/admin/bi"
        />
        <StatCard
          icon={Users}
          label="Clients"
          value={stats.clientsUniques}
          iconClass="bg-indigo-50 text-indigo-700"
          href="/admin/clients"
        />
        <StatCard
          icon={Boxes}
          label="Stock faible"
          value={stats.stockFaible}
          iconClass="bg-orange-50 text-orange-700"
          href="/admin/stocks"
        />
        <StatCard
          icon={Tag}
          label="Promotions"
          value={stats.promotionsActives}
          iconClass="bg-pink-50 text-pink-600"
          href="/admin/promotions"
        />
        <StatCard
          icon={MessageSquare}
          label="Messages non lus"
          value={stats.messagesNonLus}
          iconClass="bg-red-50 text-red-600"
          href="/admin/messagerie"
        />
      </div>

      {/* Grille principale */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <div className={ADMIN_CARD}>
            <div className="flex items-center justify-between px-5 py-4 md:px-6 border-b border-beige-border/60">
              <h2 className="font-serif text-lg font-bold text-zinc-900">Commandes récentes</h2>
              <Link href="/admin/commandes" className={ADMIN_WIDGET_LINK}>
                Voir tout
              </Link>
            </div>
            {recentOrders.length === 0 ? (
              <p className="p-6 text-sm text-zinc-500">Aucune commande pour le moment.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-beige-border/60 text-left text-[11px] uppercase tracking-wide text-zinc-400">
                      <th className="px-5 py-3 font-semibold md:px-6">N° commande</th>
                      <th className="px-3 py-3 font-semibold hidden sm:table-cell">Client</th>
                      <th className="px-3 py-3 font-semibold">Montant</th>
                      <th className="px-3 py-3 font-semibold">Statut</th>
                      <th className="px-5 py-3 font-semibold md:px-6 text-right">Détails</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map((cmd) => (
                      <tr
                        key={cmd.id}
                        className="border-b border-beige-border/40 last:border-0 hover:bg-cream/50"
                      >
                        <td className="px-5 py-3.5 md:px-6 font-medium text-zinc-900">
                          #{cmd.id.slice(0, 8).toUpperCase()}
                        </td>
                        <td className="px-3 py-3.5 text-zinc-500 hidden sm:table-cell">
                          {cmd.clientNom}
                        </td>
                        <td className="px-3 py-3.5 font-semibold text-zinc-900">
                          {Number(cmd.montantTotal).toLocaleString('fr-FR')} GN
                        </td>
                        <td className="px-3 py-3.5">
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ring-1 ring-inset ${
                              STATUT_STYLES[cmd.statut] ?? STATUT_STYLES.EN_ATTENTE
                            }`}
                          >
                            {STATUT_LABELS[cmd.statut] ?? cmd.statut}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 md:px-6 text-right">
                          <Link href="/admin/commandes" className={ADMIN_WIDGET_LINK}>
                            Gérer
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className={ADMIN_CARD}>
            <div className="flex items-center justify-between px-5 py-4 md:px-6 border-b border-beige-border/60">
              <h2 className="font-serif text-lg font-bold text-zinc-900 flex items-center gap-2">
                Messages clients
                {messagesUnread > 0 && (
                  <span className="rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white">
                    {messagesUnread}
                  </span>
                )}
              </h2>
              <Link href="/admin/messagerie" className={ADMIN_WIDGET_LINK}>
                Voir tout
              </Link>
            </div>
            {messagePreview.length === 0 ? (
              <p className="p-6 text-sm text-zinc-500">Aucun message client pour le moment.</p>
            ) : (
              <ul className="divide-y divide-beige-border/60">
                {messagePreview.map((conv) => (
                  <li key={conv.id}>
                    <Link
                      href={`/admin/messagerie?c=${conv.id}`}
                      className="flex items-start gap-3 px-5 py-4 md:px-6 hover:bg-cream/50 transition"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-olive-light text-olive">
                        <MessageSquare className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-zinc-900 truncate">{conv.clientNom}</p>
                          {conv.nonLuVendeur > 0 && (
                            <span className="shrink-0 rounded-full bg-olive px-1.5 py-0.5 text-[10px] font-bold text-white">
                              {conv.nonLuVendeur}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-zinc-500 mt-0.5 truncate">
                          {conv.dernierMessage ?? 'Nouvelle conversation'}
                        </p>
                      </div>
                      <ArrowUpRight className="h-4 w-4 text-zinc-400 shrink-0 mt-1" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className={ADMIN_CARD}>
            <div className="px-5 py-4 md:px-6 border-b border-beige-border/60">
              <h2 className="font-serif text-lg font-bold text-zinc-900">Activité boutique</h2>
            </div>
            <ul className="divide-y divide-beige-border/60">
              {[
                {
                  label: 'Commandes en attente',
                  detail: `${stats.commandesEnAttente} à traiter`,
                  href: '/admin/commandes',
                },
                {
                  label: 'Stock faible',
                  detail: `${stats.stockFaible} variante(s) ≤ 5 unités`,
                  href: '/admin/stocks',
                },
                {
                  label: 'Messages clients',
                  detail: `${stats.messagesNonLus} non lu(s)`,
                  href: '/admin/messagerie',
                },
                {
                  label: 'Avis clients',
                  detail: `${stats.avisClients} avis reçu(s)`,
                  href: '/admin/avis',
                },
              ].map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="flex items-start gap-3 px-5 py-4 md:px-6 hover:bg-cream/50 transition"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-olive-light text-olive">
                      <Package className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-zinc-900">{item.label}</p>
                      <p className="text-xs text-zinc-500 mt-0.5">{item.detail}</p>
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-zinc-400 shrink-0 mt-1" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="space-y-6">
          <div className={`${ADMIN_CARD} p-5 md:p-6`}>
            <h2 className="font-serif text-base font-bold text-zinc-900 mb-4">Accès rapide</h2>
            <ul className="space-y-1">
              {QUICK_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm text-zinc-700 hover:bg-cream transition"
                  >
                    <span>{link.label}</span>
                    <ArrowUpRight className="h-4 w-4 text-zinc-400" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className={`${ADMIN_CARD} p-5 md:p-6`}>
            <h2 className="font-serif text-base font-bold text-zinc-900 mb-4">État de la boutique</h2>
            <ul className="space-y-2 text-sm text-zinc-600">
              <li>{stats.produitsActifs} produit(s) en ligne</li>
              <li>{stats.commandesEnAttente} commande(s) à traiter</li>
              <li>{stats.stockFaible} variante(s) en stock faible</li>
              <li>{stats.messagesNonLus} message(s) client non lu(s)</li>
              <li>{stats.visitesAujourdhui} visite(s) aujourd&apos;hui</li>
              <li>{stats.avisClients} avis client(s) reçu(s)</li>
            </ul>
          </div>

          <div className={`${ADMIN_CARD} p-5 md:p-6`}>
            <h2 className="font-serif text-base font-bold text-zinc-900 mb-4">Communication</h2>
            <ul className="space-y-1">
              <li>
                <Link
                  href="/admin/messagerie"
                  className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm text-zinc-700 hover:bg-cream transition"
                >
                  <span className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-olive" />
                    Messagerie clients
                  </span>
                  <ArrowUpRight className="h-4 w-4 text-zinc-400" />
                </Link>
              </li>
              <li>
                <Link
                  href="/admin/contact"
                  className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm text-zinc-700 hover:bg-cream transition"
                >
                  <span className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-olive" />
                    Messages contact
                  </span>
                  <ArrowUpRight className="h-4 w-4 text-zinc-400" />
                </Link>
              </li>
              <li>
                <Link
                  href="/admin/parametres"
                  className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm text-zinc-700 hover:bg-cream transition"
                >
                  <span className="flex items-center gap-2">
                    <Settings className="h-4 w-4 text-olive" />
                    Paramètres boutique
                  </span>
                  <ArrowUpRight className="h-4 w-4 text-zinc-400" />
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
