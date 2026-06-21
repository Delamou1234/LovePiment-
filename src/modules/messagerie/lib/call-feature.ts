import { storeSettingsService } from '@/modules/admin/services/store-settings.service';

export async function assertAppelsActifs(): Promise<{ ok: true } | { ok: false; message: string }> {
  const flags = await storeSettingsService.getFeatureFlags();
  if (!flags.appelsActifs) {
    return { ok: false, message: 'Les appels vocaux sont désactivés par l\'administrateur' };
  }
  return { ok: true };
}
