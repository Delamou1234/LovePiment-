'use client';

export const AVATAR_UPDATED_EVENT = 'lovepiment:avatar-updated';

export function notifyAvatarUpdated(avatarUrl: string | null) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent(AVATAR_UPDATED_EVENT, { detail: { avatarUrl } }),
  );
}
