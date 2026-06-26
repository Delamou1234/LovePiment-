'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import {
  Banknote,
  Eye,
  Loader2,
  Package,
  ShoppingBag,
  Star,
  TrendingDown,
  TrendingUp,
  Users,
} from 'lucide-react';
import type { BiPeriode } from '@/modules/admin/services/bi.service';
import type { DashboardOverview } from '@/modules/admin/services/dashboard-overview.service';
import { DashboardHomeButton } from '@/shared/ui/DashboardHomeButton';
import { STATUT_LABELS, STATUT_STYLES } from '@/modules/compte/components/compte-ui';

const PERIODES: { value: BiPeriode; label: string }[] = [
  { value: '7j', label: '7 jours' },
  { value: '30j', label: '30 jours' },
  { value: '90j', label: '90 jours' },
];

function formatGn(n: number) {
  return `${n.toLocaleString('fr-FR')} GN`;
}

function formatPct(n: number | null) {
  if (n == null) return null;
  const sign = n > 0 ? '+' : '';
  return `${sign}${n}%`;
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3_600_000);
  if (h < 1) return 'À l\'instant';
  if (h < 24) return `Il y a ${h}h`;
  const d = Math.floor(h / 24);
  return `Il y a ${d}j`;
}

function KpiCard({
  icon: Icon,
  label,
  value,
  trend,
  iconClass,
}: {
  icon: typeof Banknote;
  label: string;
  value: string;
  trend: number | null;
  iconClass: string;
}) {
  const trendLabel = formatPct(trend);
  const positive = trend == null || trend >= 0;

  return (
    <div className="admin-dash-kpi">
      <div className={`admin-dash-kpi-icon ${iconClass}`}>
        <Icon className="h-5 w-5" strokeWidth={1.75} />
      </div>
      <div className="admin-dash-kpi-body">
        <p className="admin-dash-kpi-label">{label}</p>
        <p className="admin-dash-kpi-value">{value}</p>
        {trendLabel && (
          <p className={`admin-dash-kpi-trend ${positive ? 'is-up' : 'is-down'}`}>
            {positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {trendLabel} vs période précédente
          </p>
        )}
      </div>
    </div>
  );
}

function SalesLineChart({ data }: { data: DashboardOverview['ventesParJour'] }) {
  if (data.length === 0) {
    return <p className="admin-dash-empty">Pas encore de ventes sur cette période.</p>;
  }

  const width = 560;
  const height = 200;
  const padX = 8;
  const padY = 16;
  const max = Math.max(...data.map((d) => d.montant), 1);
  const points = data.map((d, i) => {
    const x = padX + (i / Math.max(data.length - 1, 1)) * (width - padX * 2);
    const y = height - padY - (d.montant / max) * (height - padY * 2);
    return { x, y, ...d };
  });
  const line = points.map((p) => `${p.x},${p.y}`).join(' ');
  const area = `${points[0]?.x ?? 0},${height} ${line} ${points[points.length - 1]?.x ?? 0},${height}`;

  return (
    <div className="admin-dash-chart-wrap">
      <svg viewBox={`0 0 ${width} ${height}`} className="admin-dash-line-chart" aria-hidden>
        <defs>
          <linearGradient id="adminDashFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#e91e8c" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#e91e8c" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <polygon points={area} fill="url(#adminDashFill)" />
        <polyline points={line} fill="none" stroke="#e91e8c" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p) => (
          <circle key={p.date} cx={p.x} cy={p.y} r="3.5" fill="#fff" stroke="#e91e8c" strokeWidth="2" />
        ))}
      </svg>
      <div className="admin-dash-chart-labels">
        {data.map((d) => (
          <span key={d.date}>{d.label}</span>
        ))}
      </div>
    </div>
  );
}

function CategoryDonut({ data }: { data: DashboardOverview['ventesParCategorie'] }) {
  if (data.length === 0) {
    return <p className="admin-dash-empty">Aucune vente par catégorie.</p>;
  }

  const total = data.reduce((s, d) => s + d.montant, 0);
  const slices = data
    .reduce<{
      angle: number;
      slices: { nom: string; montant: number; pct: number; color: string; start: number; sweep: number }[];
    }>(
      (acc, d) => {
        const sweep = (d.montant / total) * 360;
        return {
          angle: acc.angle + sweep,
          slices: [...acc.slices, { ...d, start: acc.angle, sweep }],
        };
      },
      { angle: 0, slices: [] },
    )
    .slices;

  function arc(start: number, sweep: number, r: number, cx: number, cy: number) {
    const rad = (deg: number) => (deg * Math.PI) / 180;
    const x1 = cx + r * Math.cos(rad(start - 90));
    const y1 = cy + r * Math.sin(rad(start - 90));
    const x2 = cx + r * Math.cos(rad(start + sweep - 90));
    const y2 = cy + r * Math.sin(rad(start + sweep - 90));
    const large = sweep > 180 ? 1 : 0;
    return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`;
  }

  return (
    <div className="admin-dash-donut-wrap">
      <svg viewBox="0 0 120 120" className="admin-dash-donut" aria-hidden>
        {slices.map((s) => (
          <path key={s.nom} d={arc(s.start, s.sweep, 52, 60, 60)} fill={s.color} />
        ))}
        <circle cx="60" cy="60" r="30" fill="#fff" />
      </svg>
      <ul className="admin-dash-donut-legend">
        {data.map((d) => (
          <li key={d.nom}>
            <span className="admin-dash-donut-dot" style={{ background: d.color }} />
            <span className="admin-dash-donut-name">{d.nom}</span>
            <span className="admin-dash-donut-pct">{d.pct}%</span>
            <span className="admin-dash-donut-amt">{formatGn(d.montant)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Stars({ note }: { note: number }) {
  return (
    <span className="admin-dash-stars" aria-label={`${note} sur 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${i < note ? 'fill-amber-400 text-amber-400' : 'text-zinc-200'}`}
          strokeWidth={1.5}
        />
      ))}
    </span>
  );
}

interface AdminDashboardLiveProps {
  initialOverview: DashboardOverview;
}

export function AdminDashboardLive({ initialOverview }: AdminDashboardLiveProps) {
  const [overview, setOverview] = useState(initialOverview);
  const [periode, setPeriode] = useState<BiPeriode>(initialOverview.periode);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (p: BiPeriode) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/dashboard?periode=${p}`);
      const data = await res.json();
      if (res.ok && data.overview) setOverview(data.overview);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const es = new EventSource('/api/admin/stats/stream');
    es.onmessage = () => {
      load(periode);
    };
    return () => es.close();
  }, [load, periode]);

  const { kpis } = overview;

  return (
    <div className="admin-dash animate-fadeIn">
      <div className="admin-dash-header">
        <div>
          <h1 className="admin-dash-title">Tableau de bord</h1>
          <p className="admin-dash-subtitle">Bienvenue dans votre espace d&apos;administration Love Piment&</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <DashboardHomeButton variant="admin" />
          <div className="admin-dash-period">
            {PERIODES.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => {
                  setPeriode(p.value);
                  load(p.value);
                }}
                className={periode === p.value ? 'is-active' : ''}
              >
                {p.label}
              </button>
            ))}
            {loading && <Loader2 className="h-4 w-4 animate-spin text-[#e91e8c]" />}
          </div>
        </div>
      </div>

      <div className="admin-dash-kpi-grid">
        <KpiCard
          icon={Banknote}
          label="Ventes totales"
          value={formatGn(kpis.ventesTotales)}
          trend={kpis.ventesEvolutionPct}
          iconClass="is-pink"
        />
        <KpiCard
          icon={ShoppingBag}
          label="Commandes"
          value={String(kpis.commandes)}
          trend={kpis.commandesEvolutionPct}
          iconClass="is-purple"
        />
        <KpiCard
          icon={Users}
          label="Nouveaux clients"
          value={String(kpis.nouveauxClients)}
          trend={kpis.nouveauxClientsEvolutionPct}
          iconClass="is-amber"
        />
        <KpiCard
          icon={Banknote}
          label="Panier moyen"
          value={formatGn(kpis.panierMoyen)}
          trend={kpis.panierMoyenEvolutionPct}
          iconClass="is-green"
        />
        <KpiCard
          icon={Eye}
          label="Visites"
          value={kpis.visites.toLocaleString('fr-FR')}
          trend={kpis.visitesEvolutionPct}
          iconClass="is-blue"
        />
      </div>

      <div className="admin-dash-row-2">
        <section className="admin-dash-panel admin-dash-panel--wide">
          <div className="admin-dash-panel-head">
            <h2>Évolution des ventes</h2>
            <span className="admin-dash-chip">Par jour</span>
          </div>
          <SalesLineChart data={overview.ventesParJour} />
        </section>

        <section className="admin-dash-panel">
          <div className="admin-dash-panel-head">
            <h2>Répartition des ventes</h2>
            <span className="admin-dash-chip">Par catégorie</span>
          </div>
          <CategoryDonut data={overview.ventesParCategorie} />
        </section>

        <section className="admin-dash-panel">
          <div className="admin-dash-panel-head">
            <h2>Commandes récentes</h2>
            <Link href="/admin/commandes" className="admin-dash-link">Voir toutes</Link>
          </div>
          <ul className="admin-dash-orders">
            {overview.commandesRecentes.map((cmd) => (
              <li key={cmd.id}>
                <div>
                  <p className="admin-dash-order-id">#{cmd.id.slice(0, 8).toUpperCase()}</p>
                  <p className="admin-dash-order-client">{cmd.clientNom}</p>
                </div>
                <div className="admin-dash-order-right">
                  <p className="admin-dash-order-price">{formatGn(cmd.montantTotal)}</p>
                  <span className={`admin-dash-status ${STATUT_STYLES[cmd.statut] ?? ''}`}>
                    {STATUT_LABELS[cmd.statut] ?? cmd.statut}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="admin-dash-row-3">
        <section className="admin-dash-panel admin-dash-panel--wide">
          <div className="admin-dash-panel-head">
            <h2>Produits les plus vendus</h2>
            <Link href="/admin/produits" className="admin-dash-link">Voir tout</Link>
          </div>
          <div className="admin-dash-table-wrap">
            <table className="admin-dash-table">
              <thead>
                <tr>
                  <th>Produit</th>
                  <th>Catégorie</th>
                  <th>Vendus</th>
                  <th>Stock</th>
                  <th>Revenus</th>
                </tr>
              </thead>
              <tbody>
                {overview.topProduits.map((p) => (
                  <tr key={p.productId}>
                    <td>
                      <div className="admin-dash-product">
                        <div className="admin-dash-product-thumb">
                          {p.image ? (
                            <Image src={p.image} alt="" width={40} height={40} className="object-cover" />
                          ) : (
                            <Package className="h-4 w-4 text-zinc-400" />
                          )}
                        </div>
                        <span>{p.nom}</span>
                      </div>
                    </td>
                    <td><span className="admin-dash-cat-pill">{p.categorie}</span></td>
                    <td>{p.quantiteVendue}</td>
                    <td className={p.stock <= 5 ? 'is-low' : ''}>{p.stock}</td>
                    <td className="font-semibold">{formatGn(p.chiffreAffaires)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="admin-dash-panel">
          <div className="admin-dash-panel-head">
            <h2>Avis récents</h2>
            <Link href="/admin/avis" className="admin-dash-link">Voir tout</Link>
          </div>
          <ul className="admin-dash-reviews">
            {overview.avisRecents.length === 0 ? (
              <li className="admin-dash-empty">Aucun avis pour le moment.</li>
            ) : (
              overview.avisRecents.map((a) => (
                <li key={a.id}>
                  <div className="admin-dash-review-head">
                    <span className="admin-dash-review-avatar">
                      {a.clientNom.slice(0, 2).toUpperCase()}
                    </span>
                    <div>
                      <p className="admin-dash-review-name">{a.clientNom}</p>
                      <Stars note={a.note} />
                    </div>
                    <span className="admin-dash-review-time">{timeAgo(a.createdAt)}</span>
                  </div>
                  <p className="admin-dash-review-text">&ldquo;{a.commentaire}&rdquo;</p>
                </li>
              ))
            )}
          </ul>
        </section>

        <section className="admin-dash-panel">
          <div className="admin-dash-panel-head">
            <h2>Activité du site</h2>
          </div>
          <ul className="admin-dash-activity">
            <li>
              <Eye className="h-4 w-4 text-[#e91e8c]" />
              <div>
                <p>Visites aujourd&apos;hui</p>
                <strong>{overview.activite.visitesAujourdhui}</strong>
              </div>
            </li>
            <li>
              <Users className="h-4 w-4 text-[#a855f7]" />
              <div>
                <p>Nouvelles inscriptions</p>
                <strong>{overview.activite.nouvellesInscriptions}</strong>
              </div>
            </li>
            <li>
              <ShoppingBag className="h-4 w-4 text-[#f59e0b]" />
              <div>
                <p>Commandes aujourd&apos;hui</p>
                <strong>{overview.activite.commandesAujourdhui}</strong>
              </div>
            </li>
            <li>
              <Package className="h-4 w-4 text-[#22c55e]" />
              <div>
                <p>Produits ajoutés</p>
                <strong>{overview.activite.produitsAjoutes}</strong>
              </div>
            </li>
          </ul>
        </section>
      </div>

      <footer className="admin-dash-footer">
        <span>© {new Date().getFullYear()} Love Piment& — Tous droits réservés</span>
        <span>Version 1.0.0</span>
      </footer>
    </div>
  );
}
