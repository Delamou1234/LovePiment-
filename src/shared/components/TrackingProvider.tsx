'use client';

import { usePageTracking } from '@/shared/hooks/useTracking';

export function TrackingProvider({ children }: { children: React.ReactNode }) {
  usePageTracking();
  return <>{children}</>;
}
