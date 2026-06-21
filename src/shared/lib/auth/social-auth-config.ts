import { isAppleAuthConfigured } from '@/shared/lib/auth/apple-oauth';
import { isFacebookAuthConfigured } from '@/shared/lib/auth/facebook-oauth';
import { isGoogleAuthConfigured } from '@/shared/lib/auth/google-oauth';

export function getSocialAuthFlags() {
  return {
    google: isGoogleAuthConfigured(),
    facebook: isFacebookAuthConfigured(),
    apple: isAppleAuthConfigured(),
  };
}
