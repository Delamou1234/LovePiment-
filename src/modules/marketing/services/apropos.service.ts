import { revalidateTag } from 'next/cache';
import { prisma } from '@/shared/lib/prisma';
import { STORE_SETTINGS_ID } from '@/modules/admin/services/store-settings.service';
import {
  DEFAULT_APROPOS,
  parseAproposChiffres,
  parseAproposValeurs,
  type AproposPatchDto,
  type AproposPublicConfig,
} from '../types/apropos';

type AproposRow = {
  aproposHeroKicker: string | null;
  aproposHeroTitre: string | null;
  aproposHeroAccent: string | null;
  aproposHeroTexte: string | null;
  aproposHeroImageUrl: string | null;
  aproposMissionTitre: string | null;
  aproposMissionTexte: string | null;
  aproposHistoireTitre: string | null;
  aproposHistoireTexte: string | null;
  aproposChiffres: unknown;
  aproposValeurs: unknown;
  aproposCtaTitre: string | null;
  aproposCtaTexte: string | null;
  aproposMetaDescription: string | null;
};

function mapApropos(row: AproposRow | null): AproposPublicConfig {
  if (!row) return DEFAULT_APROPOS;

  return {
    heroKicker: row.aproposHeroKicker?.trim() || DEFAULT_APROPOS.heroKicker,
    heroTitre: row.aproposHeroTitre?.trim() || DEFAULT_APROPOS.heroTitre,
    heroAccent: row.aproposHeroAccent?.trim() || DEFAULT_APROPOS.heroAccent,
    heroTexte: row.aproposHeroTexte?.trim() || DEFAULT_APROPOS.heroTexte,
    heroImageUrl: row.aproposHeroImageUrl?.trim() || DEFAULT_APROPOS.heroImageUrl,
    missionTitre: row.aproposMissionTitre?.trim() || DEFAULT_APROPOS.missionTitre,
    missionTexte: row.aproposMissionTexte?.trim() || DEFAULT_APROPOS.missionTexte,
    histoireTitre: row.aproposHistoireTitre?.trim() || DEFAULT_APROPOS.histoireTitre,
    histoireTexte: row.aproposHistoireTexte?.trim() || DEFAULT_APROPOS.histoireTexte,
    chiffres: parseAproposChiffres(row.aproposChiffres),
    valeurs: parseAproposValeurs(row.aproposValeurs),
    ctaTitre: row.aproposCtaTitre?.trim() || DEFAULT_APROPOS.ctaTitre,
    ctaTexte: row.aproposCtaTexte?.trim() || DEFAULT_APROPOS.ctaTexte,
    metaDescription: row.aproposMetaDescription?.trim() || DEFAULT_APROPOS.metaDescription,
  };
}

const APROPOS_SELECT = {
  aproposHeroKicker: true,
  aproposHeroTitre: true,
  aproposHeroAccent: true,
  aproposHeroTexte: true,
  aproposHeroImageUrl: true,
  aproposMissionTitre: true,
  aproposMissionTexte: true,
  aproposHistoireTitre: true,
  aproposHistoireTexte: true,
  aproposChiffres: true,
  aproposValeurs: true,
  aproposCtaTitre: true,
  aproposCtaTexte: true,
  aproposMetaDescription: true,
} as const;

export class AproposService {
  async getPublicConfig(): Promise<AproposPublicConfig> {
    const row = await prisma.storeSettings.findUnique({
      where: { id: STORE_SETTINGS_ID },
      select: APROPOS_SELECT,
    });
    return mapApropos(row);
  }

  async update(dto: AproposPatchDto): Promise<AproposPublicConfig> {
    const row = await prisma.storeSettings.upsert({
      where: { id: STORE_SETTINGS_ID },
      update: {
        ...(dto.heroKicker !== undefined && { aproposHeroKicker: dto.heroKicker.trim() }),
        ...(dto.heroTitre !== undefined && { aproposHeroTitre: dto.heroTitre.trim() }),
        ...(dto.heroAccent !== undefined && { aproposHeroAccent: dto.heroAccent.trim() }),
        ...(dto.heroTexte !== undefined && { aproposHeroTexte: dto.heroTexte.trim() }),
        ...(dto.heroImageUrl !== undefined && { aproposHeroImageUrl: dto.heroImageUrl.trim() }),
        ...(dto.missionTitre !== undefined && { aproposMissionTitre: dto.missionTitre.trim() }),
        ...(dto.missionTexte !== undefined && { aproposMissionTexte: dto.missionTexte.trim() }),
        ...(dto.histoireTitre !== undefined && { aproposHistoireTitre: dto.histoireTitre.trim() }),
        ...(dto.histoireTexte !== undefined && { aproposHistoireTexte: dto.histoireTexte.trim() }),
        ...(dto.chiffres !== undefined && { aproposChiffres: dto.chiffres }),
        ...(dto.valeurs !== undefined && { aproposValeurs: dto.valeurs }),
        ...(dto.ctaTitre !== undefined && { aproposCtaTitre: dto.ctaTitre.trim() }),
        ...(dto.ctaTexte !== undefined && { aproposCtaTexte: dto.ctaTexte.trim() }),
        ...(dto.metaDescription !== undefined && {
          aproposMetaDescription: dto.metaDescription.trim(),
        }),
      },
      create: {
        id: STORE_SETTINGS_ID,
        nomBoutique: 'Love Piment&',
        aproposHeroKicker: dto.heroKicker?.trim() ?? DEFAULT_APROPOS.heroKicker,
        aproposHeroTitre: dto.heroTitre?.trim() ?? DEFAULT_APROPOS.heroTitre,
        aproposHeroAccent: dto.heroAccent?.trim() ?? DEFAULT_APROPOS.heroAccent,
        aproposHeroTexte: dto.heroTexte?.trim() ?? DEFAULT_APROPOS.heroTexte,
        aproposHeroImageUrl: dto.heroImageUrl?.trim() ?? DEFAULT_APROPOS.heroImageUrl,
        aproposMissionTitre: dto.missionTitre?.trim() ?? DEFAULT_APROPOS.missionTitre,
        aproposMissionTexte: dto.missionTexte?.trim() ?? DEFAULT_APROPOS.missionTexte,
        aproposHistoireTitre: dto.histoireTitre?.trim() ?? DEFAULT_APROPOS.histoireTitre,
        aproposHistoireTexte: dto.histoireTexte?.trim() ?? DEFAULT_APROPOS.histoireTexte,
        aproposChiffres: dto.chiffres ?? DEFAULT_APROPOS.chiffres,
        aproposValeurs: dto.valeurs ?? DEFAULT_APROPOS.valeurs,
        aproposCtaTitre: dto.ctaTitre?.trim() ?? DEFAULT_APROPOS.ctaTitre,
        aproposCtaTexte: dto.ctaTexte?.trim() ?? DEFAULT_APROPOS.ctaTexte,
        aproposMetaDescription: dto.metaDescription?.trim() ?? DEFAULT_APROPOS.metaDescription,
      },
      select: APROPOS_SELECT,
    });

    revalidateTag('apropos', 'max');
    return mapApropos(row);
  }
}

export const aproposService = new AproposService();
