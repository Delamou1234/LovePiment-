'use client';

import { ConfirmDialogProvider } from '@/shared/providers/ConfirmDialogProvider';
import { FeedbackProvider } from '@/shared/providers/FeedbackProvider';
import { AuthSessionProvider } from '@/shared/providers/AuthSessionProvider';

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthSessionProvider>
      <ConfirmDialogProvider>
        <FeedbackProvider>{children}</FeedbackProvider>
      </ConfirmDialogProvider>
    </AuthSessionProvider>
  );
}
