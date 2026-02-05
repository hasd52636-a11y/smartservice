import React, { useState, useEffect, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
  showWarning: (message: string) => void;
  showInfo: (message: string) => void;
}

const ToastItem: React.FC<{
  toast: Toast;
  onClose: (id: string) => void;
}> = ({ toast, onClose }) => {
  useEffect(() => {
    const duration = toast.duration ?? 3000;
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose(toast.id);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [toast, onClose]);

  const config = {
    success: {
      icon: CheckCircle,
      bg: 'bg-green-50 border-green-200',
      text: 'text-green-800',
      iconColor: 'text-green-500'
    },
    error: {
      icon: AlertCircle,
      bg: 'bg-red-50 border-red-200',
      text: 'text-red-800',
      iconColor: 'text-red-500'
    },
    warning: {
      icon: AlertTriangle,
      bg: 'bg-yellow-50 border-yellow-200',
      text: 'text-yellow-800',
      iconColor: 'text-yellow-500'
    },
    info: {
      icon: Info,
      bg: 'bg-blue-50 border-blue-200',
      text: 'text-blue-800',
      iconColor: 'text-blue-500'
    }
  };

  const { icon: Icon, bg, text, iconColor } = config[toast.type];

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-lg border ${bg} shadow-lg animate-in fade-in slide-in-from-top-4`}
    >
      <Icon size={20} className={iconColor} />
      <span className={`font-medium ${text}`}>{toast.message}</span>
      <button
        onClick={() => onClose(toast.id)}
        className={`ml-2 ${text} hover:opacity-70 transition-opacity`}
      >
        <X size={16} />
      </button>
    </div>
  );
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const closeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'info', duration?: number) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setToasts(prev => [...prev, { id, message, type, duration }]);
  }, []);

  const showSuccess = useCallback((message: string) => {
    showToast(message, 'success');
  }, [showToast]);

  const showError = useCallback((message: string) => {
    showToast(message, 'error', 5000);
  }, [showToast]);

  const showWarning = useCallback((message: string) => {
    showToast(message, 'warning', 4000);
  }, [showToast]);

  const showInfo = useCallback((message: string) => {
    showToast(message, 'info');
  }, [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, showSuccess, showError, showWarning, showInfo }}>
      {children}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map(toast => (
          <ToastItem key={toast.id} toast={toast} onClose={closeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

const ToastContext = React.createContext<ToastContextType | null>(null);

export const useToast = (): ToastContextType => {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export default ToastProvider;
