import { useNavigate } from 'react-router-dom';
import { BellRing, Siren, X } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import { notificationTarget } from '../utils/notificationTarget';

export default function Toasts() {
  const { toasts, dismissToast, markRead } = useNotifications();
  const { isAdmin } = useAuth();
  const navigate = useNavigate();

  if (toasts.length === 0) return null;

  const open = (toast) => {
    if (toast.notification) {
      markRead(toast.notification.id);
      navigate(notificationTarget(toast.notification, isAdmin));
    }
    dismissToast(toast.id);
  };

  return (
    <div className="toasts" aria-live="assertive">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast ${toast.tone || ''}`} role="alert">
          <span style={{ color: toast.tone === 'danger' ? 'var(--red)' : 'var(--info)', marginTop: 2 }}>
            {toast.tone === 'danger' ? <Siren size={20} /> : <BellRing size={20} />}
          </span>
          <button
            type="button"
            className="grow"
            onClick={() => open(toast)}
            style={{ background: 'none', border: 0, textAlign: 'left', padding: 0 }}
          >
            <strong style={{ display: 'block' }}>{toast.title}</strong>
            <span className="small muted">{toast.message}</span>
          </button>
          <button type="button" className="icon-btn" style={{ width: 28, height: 28, borderRadius: 8 }}
            onClick={() => dismissToast(toast.id)} aria-label="Dismiss">
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
