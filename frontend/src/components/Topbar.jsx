import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Search } from 'lucide-react';
import NotificationBell from './NotificationBell';
import SOSButton from './SOSButton';
import Avatar from './Avatar';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { statsService } from '../services/statsService';
import { roleDescriptor } from '../utils/labels';

export default function Topbar({ onToggleSidebar }) {
  const { user, isAdmin } = useAuth();
  const { status } = useNotifications();
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [results, setResults] = useState(null);
  const box = useRef(null);

  // Debounced global search against the database.
  useEffect(() => {
    if (q.trim().length < 2) { setResults(null); return undefined; }
    const handle = setTimeout(() => {
      statsService.search(q.trim()).then(setResults).catch(() => setResults(null));
    }, 250);
    return () => clearTimeout(handle);
  }, [q]);

  useEffect(() => {
    const close = (e) => box.current && !box.current.contains(e.target) && setResults(null);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const go = (path) => { setResults(null); setQ(''); navigate(path); };
  const empty = results && !results.incidents?.length && !results.contacts?.length && !results.announcements?.length;

  return (
    <header className="topbar">
      <button type="button" className="icon-btn" onClick={onToggleSidebar} aria-label="Toggle sidebar"><Menu size={19} /></button>
      <div className="search" ref={box}>
        <Search size={17} className="search-icon" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search reports, contacts, notices..." aria-label="Search" />
        {results && (
          <div className="search-results">
            {empty && <div className="small muted" style={{ padding: 12 }}>No matches found.</div>}
            {results.incidents?.length > 0 && <div className="search-group">Reports</div>}
            {results.incidents?.map((i) => (
              <button key={`i${i.refId}`} className="search-hit"
                onClick={() => go(isAdmin ? `/admin/incidents?open=${i.refId}` : `/my-reports/${i.refId}`)}>
                <strong>{i.title}</strong> <span className="xsmall">{i.code}</span>
              </button>
            ))}
            {results.contacts?.length > 0 && <div className="search-group">Contacts</div>}
            {results.contacts?.map((c) => (
              <button key={`c${c.id}`} className="search-hit" onClick={() => go(isAdmin ? '/admin/contacts' : '/contacts')}>
                <strong>{c.name}</strong> <span className="xsmall">{c.phone}</span>
              </button>
            ))}
            {results.announcements?.length > 0 && <div className="search-group">Notices</div>}
            {results.announcements?.map((a) => (
              <button key={`a${a.id}`} className="search-hit" onClick={() => go(isAdmin ? '/admin/announcements' : '/announcements')}>
                <strong>{a.title}</strong>
              </button>
            ))}
          </div>
        )}
      </div>
      <span className="topbar-spacer" />
      <span className={`conn hidden-mobile ${status}`} title="Live connection"><span className="d" />{status === 'connected' ? 'Live' : status}</span>
      {!isAdmin && <span className="hidden-mobile"><SOSButton variant="compact" /></span>}
      <NotificationBell />
      <button type="button" className="user-chip" onClick={() => navigate('/profile')} style={{ border: 0, background: 'transparent' }}>
        <Avatar user={user} />
        <span className="who hidden-mobile" style={{ textAlign: 'left' }}>
          <strong>{user?.name}</strong>
          <span>{roleDescriptor(user)}</span>
        </span>
      </button>
    </header>
  );
}
