import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';
interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  push: (type: ToastType, message: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback((type: ToastType, message: string) => {
    const id = crypto.randomUUID();
    setToasts((t) => [...t, { id, type, message }]);
    setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id));
    }, 4000);
  }, []);

  const remove = (id: string) => setToasts((t) => t.filter((x) => x.id !== id));

  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <div className="pointer-events-none fixed bottom-6 right-6 z-50 flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start gap-3 rounded-2xl px-4 py-3 shadow-card ring-1 animate-slide-up ${
              t.type === 'success'
                ? 'bg-white text-mint-700 ring-mint-200'
                : t.type === 'error'
                ? 'bg-white text-rose-600 ring-rose-200'
                : 'bg-white text-ink-700 ring-ink-200'
            }`}
          >
            {t.type === 'success' && <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-mint-500" />}
            {t.type === 'error' && <AlertCircle size={20} className="mt-0.5 shrink-0 text-rose-500" />}
            {t.type === 'info' && <Info size={20} className="mt-0.5 shrink-0 text-ink-400" />}
            <p className="text-sm font-semibold">{t.message}</p>
            <button onClick={() => remove(t.id)} className="ml-2 text-ink-300 hover:text-ink-500">
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
