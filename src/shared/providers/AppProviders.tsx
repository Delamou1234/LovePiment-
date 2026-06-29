'use client';

import { ConfirmDialogProvider } from '@/shared/providers/ConfirmDialogProvider';
import { FeedbackProvider } from '@/shared/providers/FeedbackProvider';

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ConfirmDialogProvider>
      <FeedbackProvider>{children}</FeedbackProvider>
    </ConfirmDialogProvider>
  );
}
