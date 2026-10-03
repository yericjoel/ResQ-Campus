import { useNavigate } from 'react-router-dom';
import { Bell, Siren, Megaphone, PackageSearch, FileWarning, Info } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import { formatWhen } from '../utils/format';
import { notificationTarget } from '../utils/notificationTarget';

export function NotificationIcon({ type, size = 18 }) {
  const Icon = { SOS: Siren, INCIDENT: FileWarning, LOST_FOUND: PackageSearch, ANNOUNCEMENT: Megaphone }[type] || Info;
  return <Icon size={size} />;
}

export default function NotificationPanel({ onClose }) {
  const { notifications, markRead, markAllRead, unreadCount, loaded } = useNotifications();
  const { isAdmin } = useAuth();
  const navigate = useNavigate();

  const open = (n) => {
    if (!n.read) markRead(n.id);
    onClose();
    navigate(notificationTarget(n, isAdmin));
  };

  return (
    <div className="panel" role="dialog" aria-label="Notifications">
      <div className="panel-head">
        <strong>Notifications</strong>
        {unreadCount > 0 && (
          <button type="button" className="btn btn-sm btn-ghost" onClick={markAllRead}>
            Mark all read
          </button>
        )}
      </div>
      <div className="panel-list">
        {!loaded ? (
          <div className="loading">Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div className="empty">
            <div className="empty-icon"><Bell size={24} /></div>
            <p>You&apos;re all caught up. No new notifications.</p>
          </div>
        ) : (
          notifications.slice(0, 7).map((n) => (
            <button key={n.id} type="button" className={`notif ${n.read ? '' : 'unread'}`} onClick={() => open(n)}>
              <span className={`notif-icon ${n.type}`}><NotificationIcon type={n.type} /></span>
              <span className="grow">
                <strong style={{ display: 'block', fontSize: 14 }}>{n.title}</strong>
                <span className="small muted" style={{ display: 'block' }}>{n.message}</span>
                <span className="xsmall">{formatWhen(n.createdAt)}</span>
              </span>
            </button>
          ))
        )}
      </div>
      <div style={{ padding: 10 }}>
        <button type="button" className="btn btn-secondary btn-block btn-sm"
          onClick={() => { onClose(); navigate('/notifications'); }}>
          View all notifications
        </button>
      </div>
    </div>
  );
}
