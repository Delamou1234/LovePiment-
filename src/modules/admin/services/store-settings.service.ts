import { prisma } from '@/shared/lib/prisma';
import type { LivraisonConfig } from '@/shared/lib/shipping';
import { LIVRAISON_CONFIG_DEFAULT } from '@/shared/lib/shipping';

export const STORE_SETTINGS_ID = 'lovepiment-settings';

export type StoreFeatureFlags = {
  parrainageActif: boolean;
  appelsActifs: boolean;
};

export type LivraisonSettingsDto = LivraisonConfig;

export type StoreSettingsDto = {
  id: string;
  nomBoutique: string;
  parrainageActif: boolean;
  appelsActifs: boolean;
  newsletterActif: boolean;
  newsletterTitre: string;
  newsletterDescription: string | null;
  newsletterImageUrl: string | null;
  newsletterRemisePct: number;
  newsletterCouponCode: string | null;
  livraison: LivraisonSettingsDto;
  updatedAt: string;
};

const DEFAULT_FLAGS: StoreFeatureFlags = {
  parrainageActif: true,
  appelsActifs: true,
};

function mapLivraisonFromRow(row: {
  livraisonTarifConakry: number;
  livraisonTarifHorsConakry: number;
  livraisonSeuilGratuit: number;
  livraisonVilleParDefaut: string;
  livraisonGratuiteActive: boolean;
  livraisonDelaiLabel: string | null;
  livraisonTarifsCommunes?: unknown;
}): LivraisonSettingsDto {
  const tarifsRaw = row.livraisonTarifsCommunes;
  const tarifsCommunes =
    tarifsRaw && typeof tarifsRaw === 'object' && !Array.isArray(tarifsRaw)
      ? (tarifsRaw as Record<string, number>)
      : {
          Coyah: 30_000,
          Kindia: 35_000,
        };

  return {
    villeParDefaut: row.livraisonVilleParDefaut?.trim() || LIVRAISON_CONFIG_DEFAULT.villeParDefaut,
    tarifConakry: row.livraisonTarifConakry ?? LIVRAISON_CONFIG_DEFAULT.tarifConakry,
    tarifHorsConakry:
      row.livraisonTarifHorsConakry ?? LIVRAISON_CONFIG_DEFAULT.tarifHorsConakry,
    seuilGratuit: row.livraisonSeuilGratuit ?? LIVRAISON_CONFIG_DEFAULT.seuilGratuit,
    gratuiteActive: row.livraisonGratuiteActive ?? LIVRAISON_CONFIG_DEFAULT.gratuiteActive,
    delaiLabel: row.livraisonDelaiLabel?.trim() || LIVRAISON_CONFIG_DEFAULT.delaiLabel,
    tarifsCommunes,
  };
}

function mapSettingsDto(row: {
  id: string;
  nomBoutique: string;
  parrainageActif: boolean;
  appelsActifs: boolean;
  newsletterActif: boolean;
  newsletterTitre: string;
  newsletterDescription: string | null;
  newsletterImageUrl: string | null;
  newsletterRemisePct: number;
  newsletterCouponCode: string | null;
  livraisonTarifConakry: number;
  livraisonTarifHorsConakry: number;
  livraisonSeuilGratuit: number;
  livraisonVilleParDefaut: string;
  livraisonGratuiteActive: boolean;
  livraisonDelaiLabel: string | null;
  livraisonTarifsCommunes?: unknown;
  updatedAt: Date;
}): StoreSettingsDto {
  return {
    id: row.id,
    nomBoutique: row.nomBoutique,
    parrainageActif: row.parrainageActif,
    appelsActifs: row.appelsActifs,
    newsletterActif: row.newsletterActif,
    newsletterTitre: row.newsletterTitre,
    newsletterDescription: row.newsletterDescription,
    newsletterImageUrl: row.newsletterImageUrl,
    newsletterRemisePct: row.newsletterRemisePct,
    newsletterCouponCode: row.newsletterCouponCode,
    livraison: mapLivraisonFromRow(row),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export class StoreSettingsService {
  async ensureSettings() {
    return prisma.storeSettings.upsert({
      where: { id: STORE_SETTINGS_ID },
      update: {},
      create: {
        id: STORE_SETTINGS_ID,
        nomBoutique: 'Love Piment&',
        parrainageActif: true,
        appelsActifs: true,
        newsletterActif: true,
        newsletterTitre: 'Offre de bienvenue !',
        newsletterDescription: 'Recevez votre code promo par e-mail en quelques secondes. Offre valable sur votre première commande, livraison discrète à Conakry.',
        newsletterImageUrl: '/images/love-piment-brand-story.png',
        newsletterRemisePct: 10,
        newsletterCouponCode: 'BIENVENUE10',
        livraisonTarifConakry: LIVRAISON_CONFIG_DEFAULT.tarifConakry,
        livraisonTarifHorsConakry: LIVRAISON_CONFIG_DEFAULT.tarifHorsConakry,
        livraisonSeuilGratuit: LIVRAISON_CONFIG_DEFAULT.seuilGratuit,
        livraisonVilleParDefaut: LIVRAISON_CONFIG_DEFAULT.villeParDefaut,
        livraisonGratuiteActive: LIVRAISON_CONFIG_DEFAULT.gratuiteActive,
        livraisonDelaiLabel: LIVRAISON_CONFIG_DEFAULT.delaiLabel,
      },
    });
  }

  async getFeatureFlags(): Promise<StoreFeatureFlags> {
    const row = await prisma.storeSettings.findUnique({
      where: { id: STORE_SETTINGS_ID },
      select: { parrainageActif: true, appelsActifs: true },
    });

    if (!row) {
      await this.ensureSettings();
      return DEFAULT_FLAGS;
    }

    return {
      parrainageActif: row.parrainageActif,
      appelsActifs: row.appelsActifs,
    };
  }

  async getLivraisonConfig(): Promise<LivraisonSettingsDto> {
    const row = await this.ensureSettings();
    return mapLivraisonFromRow(row);
  }

  async getSettings(): Promise<StoreSettingsDto> {
    const row = await this.ensureSettings();
    return mapSettingsDto(row);
  }

  async updateFeatureFlags(flags: Partial<StoreFeatureFlags>): Promise<StoreSettingsDto> {
    await this.ensureSettings();
    const row = await prisma.storeSettings.update({
      where: { id: STORE_SETTINGS_ID },
      data: {
        ...(flags.parrainageActif !== undefined && { parrainageActif: flags.parrainageActif }),
        ...(flags.appelsActifs !== undefined && { appelsActifs: flags.appelsActifs }),
      },
    });

    return mapSettingsDto(row);
  }

  async updateLivraisonSettings(
    data: Partial<LivraisonSettingsDto>,
  ): Promise<StoreSettingsDto> {
    await this.ensureSettings();
    const row = await prisma.storeSettings.update({
      where: { id: STORE_SETTINGS_ID },
      data: {
        ...(data.tarifConakry !== undefined && { livraisonTarifConakry: data.tarifConakry }),
        ...(data.tarifHorsConakry !== undefined && {
          livraisonTarifHorsConakry: data.tarifHorsConakry,
        }),
        ...(data.seuilGratuit !== undefined && { livraisonSeuilGratuit: data.seuilGratuit }),
        ...(data.villeParDefaut !== undefined && {
          livraisonVilleParDefaut: data.villeParDefaut.trim(),
        }),
        ...(data.gratuiteActive !== undefined && {
          livraisonGratuiteActive: data.gratuiteActive,
        }),
        ...(data.delaiLabel !== undefined && {
          livraisonDelaiLabel: data.delaiLabel?.trim() || null,
        }),
        ...(data.tarifsCommunes !== undefined && {
          livraisonTarifsCommunes: data.tarifsCommunes,
        }),
      },
    });

    return mapSettingsDto(row);
  }

  async updateNewsletterSettings(
    data: Partial<
      Pick<
        StoreSettingsDto,
        | 'newsletterActif'
        | 'newsletterTitre'
        | 'newsletterDescription'
        | 'newsletterImageUrl'
        | 'newsletterRemisePct'
        | 'newsletterCouponCode'
      >
    >,
  ): Promise<StoreSettingsDto> {
    await this.ensureSettings();
    const row = await prisma.storeSettings.update({
      where: { id: STORE_SETTINGS_ID },
      data: {
        ...(data.newsletterActif !== undefined && { newsletterActif: data.newsletterActif }),
        ...(data.newsletterTitre !== undefined && {
          newsletterTitre: data.newsletterTitre.trim(),
        }),
        ...(data.newsletterDescription !== undefined && {
          newsletterDescription: data.newsletterDescription?.trim() || null,
        }),
        ...(data.newsletterImageUrl !== undefined && {
          newsletterImageUrl: data.newsletterImageUrl?.trim() || null,
        }),
        ...(data.newsletterRemisePct !== undefined && {
          newsletterRemisePct: data.newsletterRemisePct,
        }),
        ...(data.newsletterCouponCode !== undefined && {
          newsletterCouponCode: data.newsletterCouponCode?.trim() || null,
        }),
      },
    });

    return mapSettingsDto(row);
  }
}

export const storeSettingsService = new StoreSettingsService();
