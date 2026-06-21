import { prisma } from '@/shared/lib/prisma';

export const STORE_SETTINGS_ID = 'kabishop-settings';

export type StoreFeatureFlags = {
  parrainageActif: boolean;
  appelsActifs: boolean;
};

export type StoreSettingsDto = {
  id: string;
  nomBoutique: string;
  parrainageActif: boolean;
  appelsActifs: boolean;
  updatedAt: string;
};

const DEFAULT_FLAGS: StoreFeatureFlags = {
  parrainageActif: true,
  appelsActifs: true,
};

export class StoreSettingsService {
  async ensureSettings() {
    return prisma.storeSettings.upsert({
      where: { id: STORE_SETTINGS_ID },
      update: {},
      create: {
        id: STORE_SETTINGS_ID,
        nomBoutique: 'KabiShop',
        parrainageActif: true,
        appelsActifs: true,
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

  async getSettings(): Promise<StoreSettingsDto> {
    const row = await this.ensureSettings();
    return {
      id: row.id,
      nomBoutique: row.nomBoutique,
      parrainageActif: row.parrainageActif,
      appelsActifs: row.appelsActifs,
      updatedAt: row.updatedAt.toISOString(),
    };
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

    return {
      id: row.id,
      nomBoutique: row.nomBoutique,
      parrainageActif: row.parrainageActif,
      appelsActifs: row.appelsActifs,
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}

export const storeSettingsService = new StoreSettingsService();
