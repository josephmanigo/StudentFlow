'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

export type ToastType = 'success' | 'warning' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (message: string, type: ToastType = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      removeToast(id);
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const getBorderColor = (type: ToastType) => {
    switch (type) {
      case 'success': return 'border-sky-500/20';
      case 'error': return 'border-rose-500/20';
      case 'warning': return 'border-amber-500/20';
      default: return 'border-slate-200/50';
    }
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      
      {/* Toast Container */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full px-4 sm:px-0">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-center justify-between py-3.5 px-5 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border ${getBorderColor(toast.type)} transition-all duration-300 transform translate-y-0 animate-fade-in`}
          >
            <div className="flex items-center gap-3">
              <span className={`text-xs font-semibold tracking-wide uppercase ${
                toast.type === 'success' ? 'text-sky-600' :
                toast.type === 'error' ? 'text-rose-600' :
                toast.type === 'warning' ? 'text-amber-600' : 'text-slate-600'
              }`}>
                {toast.type}
              </span>
              <span className="text-xs font-semibold text-slate-800">{toast.message}</span>
            </div>
            
            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-slate-700 text-[10px] font-bold uppercase tracking-wider ml-4 shrink-0 focus:outline-none cursor-pointer"
            >
              dismiss
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
