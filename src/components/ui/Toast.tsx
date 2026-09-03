import React, { createContext, useContext, useState, useCallback } from 'react';
import { cn } from '../../lib/utils';
import { X, CheckCircle2, AlertTriangle, Info, AlertCircle } from 'lucide-react';

// ── Types ────────────────────────────────────────────────────────────────────

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
}

interface ToastContextType {
  toast: (message: string, variant?: ToastVariant) => void;
}

const ToastContext = createContext<ToastContextType>({
  toast: () => {},
});

export const useToast = () => useContext(ToastContext);

// ── Provider ─────────────────────────────────────────────────────────────────

let toastCounter = 0;

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, variant: ToastVariant = 'success') => {
    const id = `toast-${++toastCounter}`;
    setToasts(prev => [...prev, { id, message, variant }]);

    // Auto-dismiss after 4s
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}

      {/* Toast container */}
      <div
        className="fixed bottom-6 right-6 z-[60] flex flex-col gap-2 max-w-sm w-full pointer-events-none"
        aria-live="polite"
        role="status"
      >
        {toasts.map(t => (
          <ToastItem key={t.id} toast={t} onDismiss={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

// ── Individual Toast ─────────────────────────────────────────────────────────

const variantConfig: Record<ToastVariant, { icon: React.ReactNode; classes: string }> = {
  success: {
    icon: <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />,
    classes: 'border-emerald-200 bg-white',
  },
  error: {
    icon: <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />,
    classes: 'border-rose-200 bg-white',
  },
  warning: {
    icon: <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />,
    classes: 'border-amber-200 bg-white',
  },
  info: {
    icon: <Info className="w-5 h-5 text-sky-500 shrink-0" />,
    classes: 'border-sky-200 bg-white',
  },
};

const ToastItem: React.FC<{ toast: Toast; onDismiss: (id: string) => void }> = ({
  toast,
  onDismiss,
}) => {
  const config = variantConfig[toast.variant];

  return (
    <div
      className={cn(
        'pointer-events-auto flex items-center gap-3 rounded-xl border shadow-lg px-4 py-3 text-sm text-slate-800 animate-in slide-in-from-bottom-2 duration-200',
        config.classes
      )}
    >
      {config.icon}
      <span className="flex-1 font-medium">{toast.message}</span>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        className="p-1 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
        aria-label="Dismiss notification"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
