import { Megaphone } from 'lucide-react';
import useAsync from '../hooks/useAsync';
import { announcementService } from '../services/announcementService';
import { useRealtime } from '../context/NotificationContext';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';
import EmptyState from '../components/EmptyState';
import { formatWhen } from '../utils/format';
import { label } from '../utils/labels';

export default function Announcements() {
  const { data, loading, error, reload } = useAsync(() => announcementService.list(), []);
  useRealtime('announcement', () => reload());
  useRealtime('resync', () => reload());

  return (
    <div className="stack" style={{ gap: 20, maxWidth: 860 }}>
      <div className="page-head"><div><h1>Announcements</h1><p>Official notices from campus administration and security.</p></div></div>
      <ErrorAlert message={error} onRetry={reload} />
      {loading && !data ? <LoadingSpinner message="Loading announcements..." /> : !data?.length ? (
        <div className="card"><EmptyState icon={Megaphone} title="No announcements" message="Nothing has been published yet." /></div>
      ) : data.map((a) => (
        <article key={a.id} className={`card notice-card ${a.priority.toLowerCase()}`}>
          <div className="row between wrap">
            <h3>{a.title}</h3>
            <div className="row"><span className="badge tone-dark">{label(a.category)}</span><StatusBadge status={a.priority} /></div>
          </div>
          <p style={{ whiteSpace: 'pre-wrap' }}>{a.description}</p>
          <span className="xsmall">By {a.authorName} · {formatWhen(a.publishedAt || a.createdAt)}</span>
        </article>
      ))}
    </div>
  );
}
