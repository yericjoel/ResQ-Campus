import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import { NotificationIcon } from '../components/NotificationPanel';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import { formatWhen } from '../utils/format';
import { notificationTarget } from '../utils/notificationTarget';

export default function Notifications() {
  const { notifications, loaded, unreadCount, markRead, markAllRead } = useNotifications();
  const { isAdmin } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="stack" style={{ gap: 20, maxWidth: 820 }}>
      <div className="page-head">
        <div><h1>Notifications</h1><p>{unreadCount} unread</p></div>
        {unreadCount > 0 && <button className="btn btn-secondary" onClick={markAllRead}>Mark all as read</button>}
      </div>
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {!loaded ? <LoadingSpinner message="Loading notifications..." /> : notifications.length === 0 ? (
          <EmptyState icon={Bell} title="You're all caught up." message="No new notifications." />
        ) : notifications.map((n) => (
          <button key={n.id} type="button" className={`notif ${n.read ? '' : 'unread'}`}
            onClick={() => { if (!n.read) markRead(n.id); navigate(notificationTarget(n, isAdmin)); }}>
            <span className={`notif-icon ${n.type}`}><NotificationIcon type={n.type} /></span>
            <span className="grow">
              <strong style={{ display: 'block' }}>{n.title}</strong>
              <span className="small muted" style={{ display: 'block' }}>{n.message}</span>
              <span className="xsmall">{formatWhen(n.createdAt)}</span>
            </span>
            {!n.read && <span className="badge tone-info">New</span>}
          </button>
        ))}
      </div>
    </div>
  );
}
