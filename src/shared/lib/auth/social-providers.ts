export type SocialAuthProviders = {
  google: boolean;
  facebook: boolean;
  apple: boolean;
};

function configured(id: string | undefined, secret: string | undefined): boolean {
  return Boolean(id?.trim() && secret?.trim());
}

/** Providers OAuth activés selon les variables d'environnement serveur. */
export function getSocialAuthProviders(): SocialAuthProviders {
  return {
    google: configured(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET),
    facebook: configured(process.env.FACEBOOK_APP_ID, process.env.FACEBOOK_APP_SECRET),
    apple: configured(
      process.env.APPLE_CLIENT_ID,
      process.env.APPLE_PRIVATE_KEY ?? process.env.APPLE_TEAM_ID,
    ),
  };
}

export function hasAnySocialProvider(providers: SocialAuthProviders): boolean {
  return providers.google || providers.facebook || providers.apple;
}
