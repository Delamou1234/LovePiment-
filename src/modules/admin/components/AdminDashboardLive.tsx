'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Package,
  ShoppingBag,
  TrendingUp,
  ArrowRight,
  Users,
  Tag,
  Boxes,
  MessageSquare,
  Banknote,
  Radio,
} from 'lucide-react';
import type { AdminDashboardStats } from '@/modules/admin/services/admin-stats.service';

function formatGn(n: number) {
  return n.toLocaleString('fr-FR') + ' GN';
}

function formatHeure(date: Date) {
  return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

const CARDS = [
  { key: 'produitsActifs' as const, label: 'Produits actifs', icon: Package, href: '/admin/produits', format: (v: number) => String(v) },
  { key: 'commandesEnAttente' as const, label: 'Commandes en attente', icon: ShoppingBag, href: '/admin/commandes', format: (v: number) => String(v) },
  { key: 'visites7j' as const, label: 'Visites (7 j)', icon: TrendingUp, href: '/admin/trafic', format: (v: number) => String(v) },
  { key: 'chiffreAffaires' as const, label: "Chiffre d'affaires", icon: Banknote, href: '/admin/bi', format: formatGn },
  { key: 'clientsUniques' as const, label: 'Clients', icon: Users, href: '/admin/clients', format: (v: number) => String(v) },
  { key: 'stockFaible' as const, label: 'Stock faible (≤5)', icon: Boxes, href: '/admin/stocks', format: (v: number) => String(v) },
  { key: 'promotionsActives' as const, label: 'Promotions actives', icon: Tag, href: '/admin/promotions', format: (v: number) => String(v) },
  { key: 'messagesNonLus' as const, label: 'Messages non lus', icon: MessageSquare, href: '/admin/messagerie', format: (v: number) => String(v) },
];

const QUICK_LINKS = [
  { label: 'Ajouter un produit', href: '/admin/produits' },
  { label: 'Traiter les commandes', href: '/admin/commandes' },
  { label: 'Business Intelligence', href: '/admin/bi' },
  { label: 'Voir les rapports trafic', href: '/admin/trafic' },
  { label: 'Gérer les stocks', href: '/admin/stocks' },
];

interface AdminDashboardLiveProps {
  initialStats: AdminDashboardStats;
}

export function AdminDashboardLive({ initialStats }: AdminDashboardLiveProps) {
  const [stats, setStats] = useState(initialStats);
  const [connected, setConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [pulseKey, setPulseKey] = useState(0);

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

  return (
    <div className="max-w-6xl animate-fadeIn">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-zinc-900">
            Tableau de bord
          </h1>
          <p className="text-zinc-500 mt-1">
            {stats.commandesTotal} commande{stats.commandesTotal > 1 ? 's' : ''} au total
            {stats.commandesAujourdhui > 0 && (
              <> · {stats.commandesAujourdhui} aujourd&apos;hui</>
            )}
          </p>
        </div>
        <div
          className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium ${
            connected
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-zinc-200 bg-zinc-50 text-zinc-500'
          }`}
        >
          <Radio className={`h-3.5 w-3.5 ${connected ? 'animate-pulse' : ''}`} />
          {connected ? 'Statistiques en direct' : 'Reconnexion…'}
          {lastUpdate && connected && (
            <span className="text-emerald-600/70">· {formatHeure(lastUpdate)}</span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {CARDS.map(({ key, label, icon: Icon, href, format }) => (
          <Link
            key={key}
            href={href}
            className="rounded-xl border border-zinc-200 bg-white p-5 hover:border-zinc-300 hover:shadow-sm transition group"
          >
            <div className="flex items-center justify-between mb-3">
              <Icon className="h-5 w-5 text-[#4a5240]" />
              <ArrowRight className="h-4 w-4 text-zinc-300 group-hover:text-zinc-500 transition" />
            </div>
            <p
              key={`${key}-${pulseKey}`}
              className="text-xl font-bold text-zinc-900 truncate transition-all duration-300"
            >
              {format(stats[key])}
            </p>
            <p className="text-sm text-zinc-500 mt-0.5">{label}</p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-[#ebe4d8] bg-[#faf7f2] p-6">
          <h2 className="font-semibold text-zinc-900 mb-3">Accès rapide</h2>
          <ul className="space-y-2">
            {QUICK_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-sm text-[#4a5240] font-medium hover:underline flex items-center gap-1"
                >
                  {link.label}
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-6">
          <h2 className="font-semibold text-zinc-900 mb-2">État de la boutique</h2>
          <ul className="text-sm text-zinc-600 space-y-2">
            <li>{stats.produitsActifs} produit(s) en ligne</li>
            <li>{stats.commandesEnAttente} commande(s) à traiter</li>
            <li>{stats.stockFaible} variante(s) en stock faible</li>
            <li>{stats.messagesNonLus} message(s) client non lu(s)</li>
            <li>{stats.visitesAujourdhui} visite(s) aujourd&apos;hui</li>
            <li>{stats.avisClients} avis client(s) reçu(s)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
