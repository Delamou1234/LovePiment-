'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { CheckCircle2, X, XCircle } from 'lucide-react';

type Feedback = {
  id: number;
  type: 'success' | 'error';
  message: string;
};

type FeedbackContextValue = {
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
};

const FeedbackContext = createContext<FeedbackContextValue | null>(null);

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Feedback[]>([]);

  const dismiss = useCallback((id: number) => {
    setItems((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const push = useCallback(
    (type: Feedback['type'], message: string) => {
      const id = Date.now() + Math.random();
      setItems((prev) => [...prev.slice(-2), { id, type, message }]);
      window.setTimeout(() => dismiss(id), type === 'success' ? 4000 : 6000);
    },
    [dismiss],
  );

  const value = useMemo(
    () => ({
      showSuccess: (message: string) => push('success', message),
      showError: (message: string) => push('error', message),
    }),
    [push],
  );

  return (
    <FeedbackContext.Provider value={value}>
      {children}
      <div
        className="ui-feedback-stack"
        aria-live="polite"
        aria-relevant="additions"
      >
        {items.map((item) => (
          <div
            key={item.id}
            role={item.type === 'error' ? 'alert' : 'status'}
            className={`ui-feedback-toast ui-feedback-toast--${item.type}`}
          >
            {item.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden />
            ) : (
              <XCircle className="h-4 w-4 shrink-0" aria-hidden />
            )}
            <p className="flex-1 text-sm font-medium">{item.message}</p>
            <button
              type="button"
              className="ui-feedback-dismiss"
              onClick={() => dismiss(item.id)}
              aria-label="Fermer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </FeedbackContext.Provider>
  );
}

export function useFeedback() {
  const ctx = useContext(FeedbackContext);
  if (!ctx) {
    return {
      showSuccess: () => {},
      showError: () => {},
    };
  }
  return ctx;
}
