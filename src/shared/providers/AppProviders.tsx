'use client';

import { ConfirmDialogProvider } from '@/shared/providers/ConfirmDialogProvider';

export function AppProviders({ children }: { children: React.ReactNode }) {
  return <ConfirmDialogProvider>{children}</ConfirmDialogProvider>;
}
