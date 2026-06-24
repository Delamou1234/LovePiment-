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
import { CheckCircle2, LogOut, Trash2 } from 'lucide-react';
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

  const Icon = isLogout ? LogOut : isDanger ? Trash2 : CheckCircle2;
  const iconClass = isLogout
    ? 'bg-[#fce7f3] text-[#e91e8c]'
    : isDanger
      ? 'bg-[#fce7f3] text-[#9b1b2e]'
      : 'bg-emerald-50 text-emerald-700';

  return (
    <div className="confirm-dialog-root">
      <button
        type="button"
        className="confirm-dialog-backdrop"
        aria-label={cancelLabel}
        onClick={() => onClose(false)}
      />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-desc"
        className={`confirm-dialog-panel${isDanger ? ' confirm-dialog-panel--danger' : ''}`}
      >
        <div className="confirm-dialog-icon-wrap">
          <div className={`confirm-dialog-icon ${iconClass}`}>
            <Icon className="h-5 w-5" strokeWidth={1.75} />
          </div>
        </div>
        <div className="confirm-dialog-content">
          <h2 id="confirm-dialog-title" className="confirm-dialog-title">
            {title}
          </h2>
          <p id="confirm-dialog-desc" className="confirm-dialog-message">
            {message}
          </p>
        </div>

        <div className="confirm-dialog-actions">
          <button
            type="button"
            onClick={() => onClose(false)}
            className="confirm-dialog-btn confirm-dialog-btn--cancel"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            autoFocus
            onClick={() => onClose(true)}
            className={`confirm-dialog-btn confirm-dialog-btn--confirm${
              isDanger ? ' confirm-dialog-btn--danger' : isLogout ? ' confirm-dialog-btn--logout' : ''
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
