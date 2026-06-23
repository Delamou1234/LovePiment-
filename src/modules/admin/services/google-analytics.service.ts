import { BetaAnalyticsDataClient } from '@google-analytics/data';
import type { RapportPeriode } from './analytics-admin.service';
import { getGa4ApiConfig, getGa4SetupStatus } from '@/shared/lib/analytics/ga-config';

export type Ga4Rapport = {
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

function periodeEnDates(periode: RapportPeriode): { startDate: string; endDate: string } {
  const jours = periode === '7j' ? 7 : periode === '30j' ? 30 : 90;
  return { startDate: `${jours}daysAgo`, endDate: 'today' };
}

function parseMetric(row: { metricValues?: { value?: string | null }[] } | undefined, index: number): number {
  const raw = row?.metricValues?.[index]?.value;
  const n = Number(raw ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function rapportVide(message: string | null): Ga4Rapport {
  return {
    configure: false,
    message,
    utilisateursActifs: 0,
    sessions: 0,
    pagesVues: 0,
    dureeMoyenneSessionSec: 0,
    tauxRebondPct: 0,
    sessionsParSource: [],
    utilisateursParAppareil: [],
    pagesPopulaires: [],
    utilisateursParJour: [],
  };
}

export class GoogleAnalyticsService {
  private client: BetaAnalyticsDataClient | null = null;
  private propertyId: string | null = null;

  private getClient() {
    if (this.client) return { client: this.client, propertyId: this.propertyId! };

    const config = getGa4ApiConfig();
    if (!config) return null;

    this.client = new BetaAnalyticsDataClient({
      credentials: {
        client_email: config.clientEmail,
        private_key: config.privateKey,
      },
    });
    this.propertyId = config.propertyId;
    return { client: this.client, propertyId: config.propertyId };
  }

  getStatutConfiguration() {
    return getGa4SetupStatus();
  }

  async genererRapport(periode: RapportPeriode = '7j'): Promise<Ga4Rapport> {
    const setup = getGa4SetupStatus();
    if (!setup.api) {
      return rapportVide(
        setup.missing.length > 0
          ? `Variables manquantes : ${setup.missing.join(', ')}`
          : 'API Google Analytics non configurée.',
      );
    }

    const ctx = this.getClient();
    if (!ctx) return rapportVide('Impossible d\'initialiser le client Google Analytics.');

    const { client, propertyId } = ctx;
    const property = `properties/${propertyId}`;
    const { startDate, endDate } = periodeEnDates(periode);

    try {
      const [resume, sources, appareils, pages, parJour] = await Promise.all([
        client.runReport({
          property,
          dateRanges: [{ startDate, endDate }],
          metrics: [
            { name: 'activeUsers' },
            { name: 'sessions' },
            { name: 'screenPageViews' },
            { name: 'averageSessionDuration' },
            { name: 'bounceRate' },
          ],
        }),
        client.runReport({
          property,
          dateRanges: [{ startDate, endDate }],
          dimensions: [{ name: 'sessionDefaultChannelGroup' }],
          metrics: [{ name: 'sessions' }],
          orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
          limit: 8,
        }),
        client.runReport({
          property,
          dateRanges: [{ startDate, endDate }],
          dimensions: [{ name: 'deviceCategory' }],
          metrics: [{ name: 'activeUsers' }],
          orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
        }),
        client.runReport({
          property,
          dateRanges: [{ startDate, endDate }],
          dimensions: [{ name: 'pagePath' }],
          metrics: [{ name: 'screenPageViews' }],
          orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
          limit: 10,
        }),
        client.runReport({
          property,
          dateRanges: [{ startDate, endDate }],
          dimensions: [{ name: 'date' }],
          metrics: [{ name: 'activeUsers' }],
          orderBys: [{ dimension: { dimensionName: 'date' } }],
        }),
      ]);

      const row = resume[0]?.rows?.[0];
      const bounce = parseMetric(row, 4);
      const bouncePct = bounce <= 1 ? Math.round(bounce * 1000) / 10 : Math.round(bounce * 10) / 10;

      return {
        configure: true,
        message: null,
        utilisateursActifs: parseMetric(row, 0),
        sessions: parseMetric(row, 1),
        pagesVues: parseMetric(row, 2),
        dureeMoyenneSessionSec: Math.round(parseMetric(row, 3)),
        tauxRebondPct: bouncePct,
        sessionsParSource:
          sources[0]?.rows?.map((r) => ({
            source: r.dimensionValues?.[0]?.value ?? 'Inconnu',
            sessions: parseMetric(r, 0),
          })) ?? [],
        utilisateursParAppareil:
          appareils[0]?.rows?.map((r) => ({
            appareil: r.dimensionValues?.[0]?.value ?? 'Inconnu',
            users: parseMetric(r, 0),
          })) ?? [],
        pagesPopulaires:
          pages[0]?.rows?.map((r) => ({
            path: r.dimensionValues?.[0]?.value ?? '/',
            views: parseMetric(r, 0),
          })) ?? [],
        utilisateursParJour:
          parJour[0]?.rows?.map((r) => {
            const raw = r.dimensionValues?.[0]?.value ?? '';
            const date =
              raw.length === 8
                ? `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`
                : raw;
            return { date, users: parseMetric(r, 0) };
          }) ?? [],
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur API Google Analytics';
      console.error('[GoogleAnalyticsService]', err);
      return rapportVide(msg);
    }
  }
}

export const googleAnalyticsService = new GoogleAnalyticsService();
