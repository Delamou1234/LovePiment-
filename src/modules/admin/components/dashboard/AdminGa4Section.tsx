'use client';

import { useRunAfterMount } from '@/shared/hooks/useRunAfterMount';
import { useCallback, useState } from 'react';
import { ExternalLink, Loader2 } from 'lucide-react';

type Ga4Rapport = {
  configure: boolean;
  message: string | null;
  utilisateursActifs: number;
  sessions: number;
  pagesVues: number;
  dureeMoyenneSessionSec: number;
  tauxRebondPct: number;
  sessionsParSource: { source: string; sessions: number }[];
  utilisateursParAppareil: { appareil: string; users: number }[];
  pagesPopulaires: { path: string; views: number }[];
  utilisateursParJour: { date: string; users: number }[];
};

type Ga4Setup = {
  tag: boolean;
  api: boolean;
  measurementId: string | null;
  propertyId: string | null;
  missing: string[];
};

type Props = {
  periode: '7j' | '30j' | '90j';
};

function formatDuree(sec: number): string {
  if (sec < 60) return `${sec}s`;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}m ${s}s`;
}

export function AdminGa4Section({ periode }: Props) {
  const [rapport, setRapport] = useState<Ga4Rapport | null>(null);
  const [setup, setSetup] = useState<Ga4Setup | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/analytics/google?periode=${periode}`);
      if (res.ok) {
        const data = await res.json();
        setRapport(data.rapport);
        setSetup(data.setup);
      }
    } finally {
      setLoading(false);
    }
  }, [periode]);

  useRunAfterMount(() => void load(), [load]);

  const maxUsers = Math.max(...(rapport?.utilisateursParJour.map((v) => v.users) ?? [1]), 1);

  return (
    <section className="space-y-4 rounded-2xl border border-sky-200/80 bg-gradient-to-br from-sky-50/80 to-white p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-zinc-900">Google Analytics 4</h2>
          <p className="text-sm text-zinc-500 mt-1">
            Trafic réel, sources d&apos;acquisition et comportement des visiteurs.
          </p>
        </div>
        {setup?.measurementId && (
          <span className="rounded-full bg-white px-3 py-1 text-xs font-mono text-sky-800 ring-1 ring-sky-200">
            {setup.measurementId}
          </span>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-sky-600" />
        </div>
      ) : !rapport?.configure ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950 space-y-3">
          <p className="font-semibold">Configuration requise</p>
          <p className="text-amber-900/90">
            {rapport?.message ??
              'Complétez les variables GA4 dans .env.local pour activer les rapports.'}
          </p>
          {setup && setup.missing.length > 0 && (
            <ul className="list-disc pl-5 space-y-1 text-xs font-mono">
              {setup.missing.map((v) => (
                <li key={v}>{v}</li>
              ))}
            </ul>
          )}
          <ol className="list-decimal pl-5 space-y-1.5 text-xs text-amber-900/90">
            <li>
              Créez une propriété GA4 sur{' '}
              <a
                href="https://analytics.google.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold underline inline-flex items-center gap-0.5"
              >
                analytics.google.com
                <ExternalLink className="h-3 w-3" />
              </a>
            </li>
            <li>
              Copiez l&apos;ID de mesure (<code className="font-mono">G-…</code>) dans{' '}
              <code className="font-mono">NEXT_PUBLIC_GA_ID</code>
            </li>
            <li>
              Créez un compte de service Google Cloud avec l&apos;API « Google Analytics Data API »
            </li>
            <li>
              Ajoutez l&apos;e-mail du compte de service comme lecteur dans GA4 (Admin → Accès à la
              propriété)
            </li>
            <li>
              Renseignez <code className="font-mono">GA4_PROPERTY_ID</code> (numérique),{' '}
              <code className="font-mono">GOOGLE_ANALYTICS_CLIENT_EMAIL</code> et{' '}
              <code className="font-mono">GOOGLE_ANALYTICS_PRIVATE_KEY</code>
            </li>
          </ol>
          {setup?.tag && !setup.api && (
            <p className="text-xs text-emerald-800 bg-emerald-50 rounded-lg px-3 py-2">
              Le tag de suivi est actif sur le site — les données s&apos;accumulent déjà dans GA4.
              L&apos;API admin s&apos;affichera une fois le compte de service configuré.
            </p>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            {[
              { label: 'Utilisateurs', value: rapport.utilisateursActifs },
              { label: 'Sessions', value: rapport.sessions },
              { label: 'Pages vues', value: rapport.pagesVues },
              { label: 'Durée moy.', value: formatDuree(rapport.dureeMoyenneSessionSec) },
              { label: 'Rebond', value: `${rapport.tauxRebondPct}%` },
            ].map((k) => (
              <div key={k.label} className="rounded-xl border border-sky-100 bg-white p-3">
                <p className="text-[10px] font-bold uppercase text-zinc-500">{k.label}</p>
                <p className="text-lg font-bold text-zinc-900 mt-1">{k.value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="rounded-xl border border-zinc-200 bg-white p-4">
              <h3 className="font-semibold text-sm mb-3">Utilisateurs par jour</h3>
              <div className="space-y-2">
                {rapport.utilisateursParJour.map((v) => (
                  <div key={v.date} className="flex items-center gap-2 text-sm">
                    <span className="w-20 text-xs text-zinc-500">{v.date.slice(5)}</span>
                    <div className="flex-1 h-2 bg-zinc-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-sky-600 rounded-full"
                        style={{ width: `${(v.users / maxUsers) * 100}%` }}
                      />
                    </div>
                    <span className="w-8 text-right font-medium">{v.users}</span>
                  </div>
                ))}
                {rapport.utilisateursParJour.length === 0 && (
                  <p className="text-sm text-zinc-400">Pas encore de données GA4 sur cette période.</p>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-zinc-200 bg-white p-4">
              <h3 className="font-semibold text-sm mb-3">Sources de trafic</h3>
              <ul className="space-y-2 text-sm">
                {rapport.sessionsParSource.map((s) => (
                  <li key={s.source} className="flex justify-between gap-2">
                    <span className="text-zinc-600 truncate">{s.source}</span>
                    <span className="font-medium shrink-0">{s.sessions}</span>
                  </li>
                ))}
                {rapport.sessionsParSource.length === 0 && (
                  <p className="text-sm text-zinc-400">Aucune session enregistrée.</p>
                )}
              </ul>
            </div>

            <div className="rounded-xl border border-zinc-200 bg-white p-4">
              <h3 className="font-semibold text-sm mb-3">Appareils</h3>
              <ul className="space-y-2 text-sm">
                {rapport.utilisateursParAppareil.map((d) => (
                  <li key={d.appareil} className="flex justify-between">
                    <span className="text-zinc-600 capitalize">{d.appareil}</span>
                    <span className="font-medium">{d.users}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-xl border border-zinc-200 bg-white p-4">
              <h3 className="font-semibold text-sm mb-3">Pages les plus vues</h3>
              <ul className="space-y-2 text-sm">
                {rapport.pagesPopulaires.map((p) => (
                  <li key={p.path} className="flex justify-between gap-2">
                    <span className="text-zinc-600 truncate font-mono text-xs">{p.path}</span>
                    <span className="font-medium shrink-0">{p.views}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {rapport.message && (
            <p className="text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2">{rapport.message}</p>
          )}
        </>
      )}
    </section>
  );
}
