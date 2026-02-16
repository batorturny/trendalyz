'use client';

import { useState, useEffect, useCallback, createContext, useContext, type ReactNode } from 'react';

type ToastType = 'error' | 'success' | 'info';

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

let nextId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const toast = useCallback((message: string, type: ToastType = 'error') => {
    const id = nextId++;
    setToasts(prev => [...prev, { id, message, type }]);
  }, []);

  const dismiss = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* Toast container */}
      <div className="fixed top-4 right-4 z-[200] flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
          <ToastItem key={t.id} item={t} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ item, onDismiss }: { item: ToastItem; onDismiss: (id: number) => void }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onDismiss(item.id), 200);
    }, 4000);
    return () => clearTimeout(timer);
  }, [item.id, onDismiss]);

  const colors: Record<ToastType, string> = {
    error: 'bg-red-500',
    success: 'bg-emerald-500',
    info: 'bg-[var(--accent)]',
  };

  const icons: Record<ToastType, string> = {
    error: 'M6 18L18 6M6 6l12 12',
    success: 'M5 13l4 4L19 7',
    info: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  };

  return (
    <div
      onClick={() => { setVisible(false); setTimeout(() => onDismiss(item.id), 200); }}
      className={`pointer-events-auto cursor-pointer flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-white text-sm font-medium max-w-sm transition-all duration-200 ${colors[item.type]} ${
        visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'
      }`}
    >
      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icons[item.type]} />
      </svg>
      {item.message}
    </div>
  );
}
