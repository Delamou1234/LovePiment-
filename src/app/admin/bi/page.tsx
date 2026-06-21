'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  BarChart3,
  Banknote,
  ExternalLink,
  Loader2,
  Package,
  RefreshCw,
  TrendingUp,
  Users,
  LineChart,
  LayoutDashboard,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

type BiRapport = {
  periode: string;
  genereLe: string;
  chiffreAffaires: {
    total: number;
    commandes: number;
    panierMoyen: number;
    evolutionPct: number | null;
    parJour: { date: string; montant: number; commandes: number }[];
    parMois: { mois: string; montant: number; commandes: number }[];
  };
  topProduits: {
    productId: string;
    nom: string;
    slug: string;
    image: string | null;
    quantiteVendue: number;
    chiffreAffaires: number;
  }[];
  clients: {
    inscrits: number;
    commandesInvite: number;
    clientsActifs: number;
    tauxFidelite: number;
    panierMoyen: number;
    topClients: {
      id: string | null;
      nom: string;
      email: string | null;
      commandes: number;
      totalDepense: number;
    }[];
    repartitionVilles: { ville: string; commandes: number }[];
  };
  previsions: {
    moyenneJournaliere: number;
    tendancePct: number | null;
    prevision7j: number;
    prevision30j: number;
    historique7j: { date: string; reel: number; prevision: number }[];
  };
  powerBi: {
    configure: boolean;
    embedUrl: string | null;
    reportUrl: string | null;
  };
};

const PERIODES = [
  { value: '7j', label: '7 jours' },
  { value: '30j', label: '30 jours' },
  { value: '90j', label: '90 jours' },
  { value: '12m', label: '12 mois' },
] as const;

function formatGn(n: number) {
  return n.toLocaleString('fr-FR') + ' GN';
}

function formatPct(n: number | null) {
  if (n == null) return '—';
  const sign = n > 0 ? '+' : '';
  return `${sign}${n} %`;
}

function BarChart({
  data,
  valueKey,
  labelKey,
  maxValue,
}: {
  data: { [key: string]: string | number }[];
  valueKey: string;
  labelKey: string;
  maxValue: number;
}) {
  return (
    <div className="space-y-2">
      {data.map((row) => {
        const val = Number(row[valueKey]);
        const label = String(row[labelKey]);
        return (
          <div key={label} className="flex items-center gap-3 text-sm">
            <span className="w-16 shrink-0 text-zinc-500 text-xs tabular-nums">
              {label.length > 7 ? label.slice(5) : label}
            </span>
            <div className="flex-1 h-2.5 bg-zinc-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#4a5240] rounded-full transition-all duration-500"
                style={{ width: `${maxValue > 0 ? (val / maxValue) * 100 : 0}%` }}
              />
            </div>
            <span className="w-24 text-right font-medium text-xs tabular-nums shrink-0">
              {typeof val === 'number' && val > 999 ? formatGn(val) : val}
            </span>
          </div>
        );
      })}
      {data.length === 0 && (
        <p className="text-sm text-zinc-400 py-4 text-center">Pas de données sur cette période.</p>
      )}
    </div>
  );
}

export default function AdminBiPage() {
  const [periode, setPeriode] = useState<(typeof PERIODES)[number]['value']>('30j');
  const [rapport, setRapport] = useState<BiRapport | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/bi?periode=${periode}`);
      if (res.ok) {
        const data = await res.json();
        setRapport(data.rapport);
      }
    } finally {
      setLoading(false);
    }
  }, [periode]);

  useEffect(() => {
    load();
  }, [load]);

  const maxCaJour = Math.max(...(rapport?.chiffreAffaires.parJour.map((d) => d.montant) ?? [1]), 1);
  const maxCaMois = Math.max(...(rapport?.chiffreAffaires.parMois.map((d) => d.montant) ?? [1]), 1);
  const maxPrev = Math.max(
    ...(rapport?.previsions.historique7j.flatMap((d) => [d.reel, d.prevision]) ?? [1]),
    1,
  );

  return (
    <div className="space-y-8 max-w-7xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#4a5240] mb-1">
            Business Intelligence
          </p>
          <h1 className="text-2xl md:text-3xl font-bold text-zinc-900 flex items-center gap-2">
            <LayoutDashboard className="h-7 w-7 text-[#4a5240]" />
            Tableaux de bord BI
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Chiffre d&apos;affaires, ventes, clients et prévisions — données live depuis PostgreSQL.
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <select
            className="input-kabishop py-2 text-sm min-w-[120px]"
            value={periode}
            onChange={(e) => setPeriode(e.target.value as typeof periode)}
          >
            {PERIODES.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        </div>
      </div>

      {loading || !rapport ? (
        <div className="flex justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-[#4a5240]" />
        </div>
      ) : (
        <>
          {/* KPIs CA */}
          <section>
            <h2 className="text-sm font-bold text-zinc-800 flex items-center gap-2 mb-4">
              <Banknote className="h-4 w-4 text-[#4a5240]" />
              Chiffre d&apos;affaires
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'CA total', value: formatGn(rapport.chiffreAffaires.total), sub: 'Commandes payées / livrées' },
                { label: 'Commandes', value: String(rapport.chiffreAffaires.commandes), sub: 'Sur la période' },
                { label: 'Panier moyen', value: formatGn(rapport.chiffreAffaires.panierMoyen), sub: 'Par commande' },
                {
                  label: 'Évolution',
                  value: formatPct(rapport.chiffreAffaires.evolutionPct),
                  sub: 'Vs période précédente',
                  highlight:
                    rapport.chiffreAffaires.evolutionPct != null &&
                    rapport.chiffreAffaires.evolutionPct >= 0,
                },
              ].map((k) => (
                <div
                  key={k.label}
                  className="rounded-xl border border-[#ebe4d8] bg-white p-5 shadow-sm"
                >
                  <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                    {k.label}
                  </p>
                  <p
                    className={`text-xl md:text-2xl font-bold mt-1 ${
                      k.label === 'Évolution' && k.highlight ? 'text-emerald-600' : 'text-zinc-900'
                    }`}
                  >
                    {k.value}
                  </p>
                  <p className="text-[11px] text-zinc-400 mt-1">{k.sub}</p>
                </div>
              ))}
            </div>
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-xl border border-[#ebe4d8] bg-white p-6 shadow-sm">
              <h3 className="font-semibold text-zinc-900 mb-4 flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-[#4a5240]" />
                CA par jour
              </h3>
              <BarChart
                data={rapport.chiffreAffaires.parJour.map((d) => ({
                  date: d.date,
                  montant: d.montant,
                }))}
                valueKey="montant"
                labelKey="date"
                maxValue={maxCaJour}
              />
            </div>

            <div className="rounded-xl border border-[#ebe4d8] bg-white p-6 shadow-sm">
              <h3 className="font-semibold text-zinc-900 mb-4 flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-[#4a5240]" />
                CA par mois
              </h3>
              <BarChart
                data={rapport.chiffreAffaires.parMois.map((d) => ({
                  mois: d.mois,
                  montant: d.montant,
                }))}
                valueKey="montant"
                labelKey="mois"
                maxValue={maxCaMois}
              />
            </div>
          </div>

          {/* Top produits */}
          <section className="rounded-xl border border-[#ebe4d8] bg-white p-6 shadow-sm">
            <h2 className="text-sm font-bold text-zinc-800 flex items-center gap-2 mb-4">
              <Package className="h-4 w-4 text-[#4a5240]" />
              Produits les plus vendus
            </h2>
            {rapport.topProduits.length === 0 ? (
              <p className="text-sm text-zinc-400 py-6 text-center">
                Aucune vente enregistrée sur cette période.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-100 text-left text-[11px] uppercase tracking-wider text-zinc-500">
                      <th className="pb-3 pr-4 font-bold">Produit</th>
                      <th className="pb-3 pr-4 font-bold text-right">Qté vendue</th>
                      <th className="pb-3 font-bold text-right">CA généré</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rapport.topProduits.map((p, i) => (
                      <tr key={p.productId} className="border-b border-zinc-50 last:border-0">
                        <td className="py-3 pr-4">
                          <Link
                            href={`/produits/${p.slug}`}
                            className="flex items-center gap-3 hover:text-[#4a5240] transition group"
                          >
                            <div className="relative h-11 w-11 shrink-0 rounded-lg overflow-hidden bg-[#f5f0e8] ring-1 ring-[#ebe4d8]">
                              {p.image && (
                                <Image
                                  src={p.image}
                                  alt=""
                                  fill
                                  className="object-cover"
                                  sizes="44px"
                                />
                              )}
                            </div>
                            <div>
                              <span className="text-[10px] text-zinc-400 font-bold">#{i + 1}</span>
                              <p className="font-medium text-zinc-900 group-hover:underline line-clamp-1">
                                {p.nom}
                              </p>
                            </div>
                          </Link>
                        </td>
                        <td className="py-3 pr-4 text-right font-semibold tabular-nums">
                          {p.quantiteVendue}
                        </td>
                        <td className="py-3 text-right font-semibold text-[#4a5240] tabular-nums">
                          {formatGn(p.chiffreAffaires)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Clients */}
          <section>
            <h2 className="text-sm font-bold text-zinc-800 flex items-center gap-2 mb-4">
              <Users className="h-4 w-4 text-[#4a5240]" />
              Analyse des clients
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
              {[
                { label: 'Inscrits', value: rapport.clients.inscrits },
                { label: 'Clients actifs', value: rapport.clients.clientsActifs },
                { label: 'Commandes invité', value: rapport.clients.commandesInvite },
                { label: 'Fidélité', value: `${rapport.clients.tauxFidelite} %` },
                { label: 'Panier moyen', value: formatGn(rapport.clients.panierMoyen) },
              ].map((k) => (
                <div
                  key={k.label}
                  className="rounded-xl border border-[#ebe4d8] bg-white p-4 shadow-sm text-center"
                >
                  <p className="text-[10px] font-bold uppercase text-zinc-500">{k.label}</p>
                  <p className="text-lg font-bold text-zinc-900 mt-1">{k.value}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="rounded-xl border border-[#ebe4d8] bg-white p-6 shadow-sm">
                <h3 className="font-semibold mb-4">Top clients (CA)</h3>
                <ul className="space-y-3">
                  {rapport.clients.topClients.map((c, i) => (
                    <li key={c.id ?? i} className="flex justify-between gap-2 text-sm">
                      <div className="min-w-0">
                        <p className="font-medium text-zinc-900 truncate">{c.nom}</p>
                        <p className="text-[11px] text-zinc-400 truncate">{c.email ?? '—'}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-bold text-[#4a5240]">{formatGn(c.totalDepense)}</p>
                        <p className="text-[10px] text-zinc-400">{c.commandes} cmd.</p>
                      </div>
                    </li>
                  ))}
                  {rapport.clients.topClients.length === 0 && (
                    <p className="text-sm text-zinc-400">Aucun client identifié.</p>
                  )}
                </ul>
              </div>

              <div className="rounded-xl border border-[#ebe4d8] bg-white p-6 shadow-sm">
                <h3 className="font-semibold mb-4">Répartition par ville</h3>
                <BarChart
                  data={rapport.clients.repartitionVilles.map((v) => ({
                    ville: v.ville,
                    commandes: v.commandes,
                  }))}
                  valueKey="commandes"
                  labelKey="ville"
                  maxValue={Math.max(
                    ...(rapport.clients.repartitionVilles.map((v) => v.commandes) ?? [1]),
                    1,
                  )}
                />
              </div>
            </div>
          </section>

          {/* Prévisions */}
          <section className="rounded-xl border border-[#ebe4d8] bg-white p-6 shadow-sm">
            <h2 className="text-sm font-bold text-zinc-800 flex items-center gap-2 mb-4">
              <TrendingUp className="h-4 w-4 text-[#4a5240]" />
              Prévisions des ventes
            </h2>
            <p className="text-xs text-zinc-500 mb-4">
              Estimation basée sur la moyenne journalière des 30 derniers jours (commandes confirmées).
            </p>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {[
                { label: 'Moy. / jour', value: formatGn(rapport.previsions.moyenneJournaliere) },
                { label: 'Tendance 7j', value: formatPct(rapport.previsions.tendancePct) },
                { label: 'Prévision 7j', value: formatGn(rapport.previsions.prevision7j) },
                { label: 'Prévision 30j', value: formatGn(rapport.previsions.prevision30j) },
              ].map((k) => (
                <div key={k.label} className="rounded-lg bg-[#faf7f2] border border-[#ebe4d8] p-4">
                  <p className="text-[10px] font-bold uppercase text-zinc-500">{k.label}</p>
                  <p className="text-lg font-bold text-zinc-900 mt-1">{k.value}</p>
                </div>
              ))}
            </div>
            <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <LineChart className="h-4 w-4" />
              Réel vs moyenne (7 derniers jours)
            </h3>
            <div className="space-y-2">
              {rapport.previsions.historique7j.map((d) => (
                <div key={d.date} className="flex items-center gap-2 text-xs">
                  <span className="w-20 text-zinc-500">{d.date.slice(5)}</span>
                  <div className="flex-1 flex gap-1 h-3">
                    <div
                      className="h-full bg-[#4a5240] rounded-sm"
                      style={{ width: `${maxPrev > 0 ? (d.reel / maxPrev) * 50 : 0}%` }}
                      title={`Réel: ${formatGn(d.reel)}`}
                    />
                    <div
                      className="h-full bg-[#4a5240]/30 rounded-sm border border-dashed border-[#4a5240]/50"
                      style={{ width: `${maxPrev > 0 ? (d.prevision / maxPrev) * 50 : 0}%` }}
                      title={`Moyenne: ${formatGn(d.prevision)}`}
                    />
                  </div>
                  <span className="w-28 text-right tabular-nums">
                    <span className="font-semibold">{formatGn(d.reel)}</span>
                    <span className="text-zinc-400"> / {formatGn(d.prevision)}</span>
                  </span>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-zinc-400 mt-3">
              ■ Réel &nbsp; ░ Moyenne 30j
            </p>
          </section>

          {/* Power BI */}
          <section className="rounded-xl border border-[#ebe4d8] bg-white p-6 shadow-sm">
            <h2 className="text-sm font-bold text-zinc-800 flex items-center gap-2 mb-2">
              <LayoutDashboard className="h-4 w-4 text-[#4a5240]" />
              Tableaux de bord Power BI
            </h2>
            {rapport.powerBi.configure && rapport.powerBi.embedUrl ? (
              <div className="mt-4 rounded-xl overflow-hidden border border-zinc-200 aspect-video bg-zinc-100">
                <iframe
                  title="Power BI KabiShop"
                  src={rapport.powerBi.embedUrl}
                  className="w-full h-full min-h-[420px]"
                  allowFullScreen
                />
              </div>
            ) : (
              <div className="mt-4 rounded-xl border-2 border-dashed border-[#ebe4d8] bg-[#faf7f2] p-8 text-center">
                <LayoutDashboard className="h-10 w-10 mx-auto text-zinc-300 mb-3" />
                <p className="text-sm font-medium text-zinc-700">Power BI non configuré</p>
                <p className="text-xs text-zinc-500 mt-2 max-w-md mx-auto leading-relaxed">
                  Ajoutez{' '}
                  <code className="bg-white px-1.5 py-0.5 rounded text-[#4a5240]">
                    NEXT_PUBLIC_POWER_BI_EMBED_URL
                  </code>{' '}
                  dans <code className="bg-white px-1.5 py-0.5 rounded">.env.local</code> pour
                  intégrer votre rapport Power BI (URL d&apos;embed publique ou sécurisée).
                </p>
                {rapport.powerBi.reportUrl && (
                  <a
                    href={rapport.powerBi.reportUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 mt-4 text-sm font-semibold text-[#4a5240] hover:underline"
                  >
                    Ouvrir le rapport Power BI
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
              </div>
            )}
            {rapport.powerBi.reportUrl && rapport.powerBi.embedUrl && (
              <a
                href={rapport.powerBi.reportUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 mt-4 text-sm font-medium text-[#4a5240] hover:underline"
              >
                Ouvrir dans Power BI
                <ExternalLink className="h-4 w-4" />
              </a>
            )}
          </section>
        </>
      )}
    </div>
  );
}
