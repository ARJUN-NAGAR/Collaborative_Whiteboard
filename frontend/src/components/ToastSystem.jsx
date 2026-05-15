import { createContext, useContext, useState, useCallback, useRef } from 'react';
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react';

const ToastCtx = createContext(null);

const ICONS = { success: CheckCircle, error: XCircle, info: Info, warning: AlertTriangle };

function ToastItem({ toast, onRemove }) {
  const Icon = ICONS[toast.type] || Info;
  return (
    <div className={`toast ${toast.type} ${toast.removing ? 'removing' : ''}`}>
      <div className="toast-icon"><Icon size={11} /></div>
      <span className="toast-msg">{toast.message}</span>
      <button className="toast-close" onClick={() => onRemove(toast.id)}><X size={13} /></button>
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef({});

  const remove = useCallback((id) => {
    setToasts(p => p.map(t => t.id === id ? { ...t, removing: true } : t));
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 220);
  }, []);

  const show = useCallback((message, type = 'info', duration = 3500) => {
    const id = crypto.randomUUID();
    setToasts(p => [...p.slice(-4), { id, message, type, removing: false }]);
    clearTimeout(timers.current[id]);
    timers.current[id] = setTimeout(() => remove(id), duration);
    return id;
  }, [remove]);

  const api = {
    success: (m, d) => show(m, 'success', d),
    error:   (m, d) => show(m, 'error', d || 5000),
    info:    (m, d) => show(m, 'info', d),
    warning: (m, d) => show(m, 'warning', d),
    dismiss: remove,
    addToast: show, // Alias for backward compatibility
  };

  return (
    <ToastCtx.Provider value={api}>
      {children}
      <div className="toast-container">
        {toasts.map(t => <ToastItem key={t.id} toast={t} onRemove={remove} />)}
      </div>
    </ToastCtx.Provider>
  );
}

export const useToast = () => useContext(ToastCtx);
