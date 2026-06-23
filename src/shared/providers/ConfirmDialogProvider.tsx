'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, CheckCircle2, LogOut } from 'lucide-react';
import {
  confirmAction as confirmActionFn,
  registerConfirmAction,
  type ActionConfirmOptions,
} from '@/shared/lib/confirm-action';
import {
  confirmLogout as confirmLogoutFn,
  getLogoutDialogCopy,
  registerConfirmLogout,
  type LogoutRole,
} from '@/shared/lib/confirm-logout';

type PendingLogout = {
  kind: 'logout';
  role: LogoutRole;
  resolve: (confirmed: boolean) => void;
};

type PendingAction = {
  kind: 'action';
  options: ActionConfirmOptions;
  resolve: (confirmed: boolean) => void;
};

type PendingConfirm = PendingLogout | PendingAction;

const ConfirmDialogContext = createContext<{
  confirmLogout: (role?: LogoutRole) => Promise<boolean>;
  confirmAction: (options: ActionConfirmOptions) => Promise<boolean>;
} | null>(null);

function ConfirmModal({
  pending,
  onClose,
}: {
  pending: PendingConfirm;
  onClose: (confirmed: boolean) => void;
}) {
  const isLogout = pending.kind === 'logout';
  const title = isLogout ? getLogoutDialogCopy(pending.role).title : pending.options.title;
  const message = isLogout ? getLogoutDialogCopy(pending.role).message : pending.options.message;
  const confirmLabel = isLogout
    ? 'Se déconnecter'
    : (pending.options.confirmLabel ?? 'Confirmer');
  const cancelLabel = isLogout ? 'Annuler' : (pending.options.cancelLabel ?? 'Annuler');
  const isDanger = !isLogout && pending.options.variant === 'danger';

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const Icon = isLogout ? LogOut : isDanger ? AlertTriangle : CheckCircle2;
  const iconClass = isLogout
    ? 'bg-olive/10 text-olive'
    : isDanger
      ? 'bg-amber-50 text-amber-700'
      : 'bg-emerald-50 text-emerald-700';

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-zinc-900/45 backdrop-blur-[2px] animate-fadeIn"
        aria-label={cancelLabel}
        onClick={() => onClose(false)}
      />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-desc"
        className="relative w-full max-w-md rounded-2xl border border-beige-border bg-white p-6 shadow-[0_24px_60px_rgba(0,0,0,0.18)] animate-fadeIn"
      >
        <div className="flex flex-col items-center text-center sm:flex-row sm:items-start sm:text-left gap-4">
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${iconClass}`}
          >
            <Icon className="h-5 w-5" strokeWidth={1.75} />
          </div>
          <div className="min-w-0 flex-1">
            <h2
              id="confirm-dialog-title"
              className="font-serif text-xl font-bold text-zinc-900 tracking-tight"
            >
              {title}
            </h2>
            <p id="confirm-dialog-desc" className="mt-2 text-sm text-zinc-500 leading-relaxed">
              {message}
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => onClose(false)}
            className="inline-flex h-11 items-center justify-center rounded-xl border border-beige-border bg-white px-5 text-sm font-semibold text-zinc-700 transition hover:bg-cream"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            autoFocus
            onClick={() => onClose(true)}
            className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold text-white transition ${
              isDanger ? 'bg-amber-700 hover:bg-amber-800' : 'bg-olive hover:bg-olive-dark'
            }`}
          >
            <Icon className="h-4 w-4" />
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export function ConfirmDialogProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<PendingConfirm | null>(null);
  const [mounted, setMounted] = useState(false);

  const openLogoutConfirm = useCallback((role: LogoutRole) => {
    return new Promise<boolean>((resolve) => {
      setPending({ kind: 'logout', role, resolve });
    });
  }, []);

  const openActionConfirm = useCallback((options: ActionConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setPending({ kind: 'action', options, resolve });
    });
  }, []);

  const closeConfirm = useCallback((confirmed: boolean) => {
    setPending((current) => {
      current?.resolve(confirmed);
      return null;
    });
  }, []);

  useEffect(() => {
    setMounted(true);
    registerConfirmLogout(openLogoutConfirm);
    registerConfirmAction(openActionConfirm);
    return () => {
      registerConfirmLogout(null);
      registerConfirmAction(null);
    };
  }, [openLogoutConfirm, openActionConfirm]);

  return (
    <ConfirmDialogContext.Provider
      value={{ confirmLogout: confirmLogoutFn, confirmAction: confirmActionFn }}
    >
      {children}
      {mounted &&
        pending &&
        createPortal(
          <ConfirmModal pending={pending} onClose={closeConfirm} />,
          document.body,
        )}
    </ConfirmDialogContext.Provider>
  );
}

export function useConfirmDialog() {
  const ctx = useContext(ConfirmDialogContext);
  if (!ctx) {
    throw new Error('useConfirmDialog doit être utilisé dans ConfirmDialogProvider');
  }
  return ctx;
}

export function useConfirmLogout() {
  return useConfirmDialog();
}
